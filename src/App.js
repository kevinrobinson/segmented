import React from 'react';
import _ from 'lodash';
import localforage from 'localforage';
import {load} from '@tensorflow-models/deeplab';
import './App.css';
import images from './images';
import cachedBits from './cached';


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      n: 3
    };
  }

  render() {
    const {n} = this.state;
    const MAX = images.length;
    const MORE = 9;
    return (
      <div className="App" onClick={async e => {
        window.localforage = localforage;
        console.log(JSON.stringify(await Promise.all((await localforage.keys()).map(async key => {
          const value = await localforage.getItem(key);
          return {key, value: _.omit(value, 'legend', 'segmentationMap', 'segmentationPixels')};
        }))));
      }}
        >
        <h1>segmented</h1>
        <div className="Subtitle">what do segmentation models see in 100 of our most iconic images?</div>
        <div className="Sources">
          <div>from <a href="http://100photos.time.com/">100photos.time.com</a></div>
          <div>with <a href="https://groups.csail.mit.edu/vision/datasets/ADE20K/">ade20k</a> via <a href="https://github.com/tensorflow/tfjs-models/tree/master/deeplab">DeepLab v3</a></div>
          <div>inspired by <a href="https://www.excavating.ai">excavating.ai</a></div>
        </div>
        <ImageGrid n={n}>
          {n < MAX && (
            <button
              onClick={e => this.setState({n: n + MORE})}
              className="MoreButton">More</button>
          )}
        </ImageGrid>
      </div>
    );
  }
}

class ImageGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      model: null,
      scrollTop: 0
    };
    this.onScroll = this.onScroll.bind(this);
  }

  async componentDidMount() {
    const base = 'ade20k';
    const quantizationBytes = 2;
    const model = await load({base, quantizationBytes});
    this.setState({model})
  }

  onScroll(e) {
    this.setState({scrollTop: e.target.scrollTop});
  }

  render() {
    const {n, children} = this.props;
    const {model} = this.state;
    return (
      <div className="ScrollContainer" onScroll={this.onScroll}>
        <div className="ImageGrid">
          {images.slice(0, n).map(image => <Image key={image.src} model={model} image={image} />)}
        </div>
        {children}
      </div>
    );
  }
}

class Image extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isImageLoaded: false
    };
    this.imgRef = React.createRef();
    this.infoRef = React.createRef();
    this.onLoad = this.onLoad.bind(this);
    this.onDone = this.onDone.bind(this);
  }

  onLoad(e) {
    this.setState({isImageLoaded: true});
  }

  onDone() {
    this.setState({isDone: true});
  }

  render() {
    const {model, image} = this.props;
    const {isImageLoaded, isDone} = this.state;
    const isReadyForSegmentation = (
      model &&
      isImageLoaded &&
      this.imgRef.current &&
      this.imgRef.current.complete &&
      this.imgRef.current.naturalHeight !== 0
    );
    return (
      <a
        key={image.filename}
        href={`http://100photos.time.com${image.href}`}
        className={_.compact(["Image-box", isDone ? 'Image-box-animating' : null]).join(' ')}>
        <div className="Image-overlay-container">      
          <img ref={this.imgRef} onLoad={this.onLoad} className="Image-img" src={`/img/${image.filename}`} alt={image.alt} />
          {isReadyForSegmentation && (
            <SegmentationOverlay
              model={model} 
              image={image}
              imgEl={this.imgRef.current}
              infoEl={this.infoRef.current}
              onDone={this.onDone}
            />
          )}
        </div>
        <div className="Image-caption">{image.alt}</div>
        <div className="Legend-container" ref={this.infoRef} />
      </a>
    );
  }
}

class SegmentationOverlay extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.onDone = this.onDone.bind(this);
  }

  componentDidMount() {
    const {model, image, imgEl} = this.props;

    if (isOptionSet('clear-localforage')) {
      console.log('clearning localforage...');
      localforage.clear();
    }
    if (isOptionSet('disabled')) return;
    setTimeout(() => go(model, image.filename, imgEl).then(this.onDone), 0);
  }

  onDone(done) {
    console.log('done.');
    const {image, imgEl, infoEl, onDone} = this.props;
    const overlayEl = this.ref.current;
    const {width, height, sortedLegend} = done;

    // image
    if (isOptionSet('disable-fetching-images')) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.classList.add('Image-overlay');
      canvas.classList.add('Image-overlay-canvas');
      canvas.style.width = getComputedStyle(imgEl).width;
      canvas.style.height = getComputedStyle(imgEl).height;
      canvas.width = width;
      canvas.height = height;
      ctx.putImageData(done.segmentationPixels, 0, 0);
      overlayEl.appendChild(canvas);

      // to build cache, force download, for dev only
      if (true && isOptionSet('force-download-for-dev')) {
        forceDownload(canvas, image.filename);
      }
    } else {
      const img = document.createElement('img');
      img.classList.add('Image-overlay');
      img.classList.add('Image-overlay-img');
      img.style.width = imgEl.style.width;
      img.style.height = imgEl.style.height;
      img.width = imgEl.width;
      img.height = imgEl.height;
      img.src = `/masks/v2/${image.filename}`
      overlayEl.appendChild(img);
    }

    // stats
    console.log('sortedLegend', sortedLegend);
    _.orderBy(sortedLegend, ['percentage'], ['desc']).slice(0, 3).forEach(sortedLegendItem => {
      const {classKey, percentage, rgb} = sortedLegendItem;
      const divEl = document.createElement('div');
      divEl.classList.add('SegmentationLegend');
      divEl.innerText = `${classKey} ${percentage}%`;
      divEl.style.color = `rgb(${rgb.join(',')})`;
      infoEl.appendChild(divEl);
    });
    // infoEl.title = sortedLegend.map(({classKey, percentage}) => `${classKey} ${percentage}%`).join("\n");

    onDone();
  }

  render() {
    return (
      <div className="SegmentationOverlay" ref={this.ref} />
    );
  }
}

async function readCache(key) {
  return await localforage.getItem(key);
}

async function writeCache(key, obj) {
  return await localforage.setItem(key, obj);
}

async function go(model, imageFilename, imageEl) {
  // load by default
  if (!isOptionSet('disable-fetching-images')) {
    const bits = _.find(cachedBits, {key: imageFilename});
    console.log('bits', bits);
    if (bits) return bits.value;
  }

  if (!isOptionSet('no-localforage')) {
    const cached = await readCache(imageFilename);
    if (cached) return cached;
  }

  console.log('segmenting...');
  const output = await model.segment(imageEl);
  console.log('displaying...');
  const {height, width, segmentationMap} = output;
  const segmentationPixels = new ImageData(segmentationMap, width, height);
  const sortedLegend = getSortedLegend(output);
  const returnValue = {...output, segmentationPixels, height, width, sortedLegend};
  if (!isOptionSet('no-localforage')) {
    await writeCache(imageFilename, returnValue);
  }
  
  return returnValue;
}

function getSortedLegend(output) {
  const {height, width, legend, segmentationMap} = output;
  // stats
  var inverseLegend = {};
  Object.keys(legend).forEach(classKey => {
    const rgbKey = legend[classKey].join(',')
    inverseLegend[rgbKey] = classKey;
  });

  var countsByClassKey = {};
  for (var i = 0; i < segmentationMap.length; i = i + 4) {
    const rgb = segmentationMap.slice(i, i+3);
    const rgbKey = rgb.join(',');
    const classKey = inverseLegend[rgbKey];
    countsByClassKey[classKey] = (countsByClassKey[classKey] || 0) + 1;
  }

  var percentages = [];
  var pixelsCount = width * height;
  Object.keys(countsByClassKey).forEach(classKey => {
    const count = countsByClassKey[classKey];
    const percentage = Math.round(100 * count / pixelsCount);
    const rgb = legend[classKey];
    percentages.push({classKey, percentage, rgb});
  });

  return _.orderBy(percentages, ['percentage'], ['desc']);
};

function forceDownload(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL()
  link.click();
}

function isOptionSet(key) {
  return (window.location.search.indexOf(key) !== -1);
}
