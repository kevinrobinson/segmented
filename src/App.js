import React from 'react';
import {load} from '@tensorflow-models/deeplab';
import './App.css';
import images from './images';


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      n: 3
    };
  }

  render() {
    const {n} = this.state;
    return (
      <div className="App">
        <h1>iconic-images</h1>
        <div>from <a href="http://100photos.time.com/">100photos.time.com</a></div>
        <div>with <a href="https://github.com/tensorflow/tfjs-models/tree/master/deeplab">DeepLab v3</a></div>
        <ImageGrid n={n} />
        <button onClick={e => this.setState({n: n + 3})} className="MoreButton">More</button>
      </div>
    );
  }
}

class ImageGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      model: null
    };
  }

  async componentDidMount() {
    const base = 'ade20k';
    const quantizationBytes = 2;
    const model = await load({base, quantizationBytes});
    this.setState({model})
  }

  render() {
    const {n} = this.props;
    const {model} = this.state;
    return (
      <div class="ImageGrid">
        {images.slice(0, n).map(image => <Image key={image.src} model={model} image={image} />)}
      </div>
    );
  }
}

class Image extends React.Component {
  constructor(props) {
    super(props);
    this.imgRef = React.createRef();
    this.state = {
      isImageLoaded: false
    };
    this.onLoad = this.onLoad.bind(this);
  }

  onLoad(e) {
    this.setState({isImageLoaded: true});
  }

  render() {
    const {model, image} = this.props;
    const {isImageLoaded} = this.state;
    return (
      <a key={image.filename} href={`http://100photos.time.com${image.href}`} className="Image-box">
        <div className="Image-overlay-container">      
          <img ref={this.imgRef} onLoad={this.onLoad} className="Image-img" src={`/img/${image.filename}`} alt={image.alt} />
          {model && isImageLoaded && this.imgRef.current && this.imgRef.current.complete && this.imgRef.current.naturalHeight !== 0 && (
            <SegmentationOverlay image={image} model={model} el={this.imgRef.current} />
          )}
        </div>
        <div className="Image-caption">{image.alt}</div>
      </a>
    );
  }
}

class SegmentationOverlay extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount() {
    const {model, el} = this.props;
    if (window.location.search.indexOf('disabled') !== -1) return;
    setTimeout(() => go(model, el, this.ref.current), 100);
  }

  render() {
    return (
      <div className="SegmentationOverlay" ref={this.ref} />
    );
  }
}

async function go(model, imageEl, outEl) {
  console.log('segmenting...', imageEl, outEl);
  const output = await model.segment(imageEl);
  console.log('displaying...');
  displaySegmentationMap(output, outEl);
  console.log('done.');
}

function displaySegmentationMap(deeplabOutput, outEl) {
  const {legend, height, width, segmentationMap} = deeplabOutput;
  console.log('deeplabOutput', deeplabOutput);
  console.log("legend", legend);
  console.log("segmentationMap", segmentationMap);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // toggleInvisible('output-card', false);
  const segmentationMapData = new ImageData(segmentationMap, width, height);
  canvas.classList.add('Image-overlay');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.width = width;
  canvas.height = height;
  ctx.putImageData(segmentationMapData, 0, 0);

  // const legendList = document.getElementById('legend');
  // while (legendList.firstChild) {
  //   legendList.removeChild(legendList.firstChild);
  // }

  // Object.keys(legend).forEach((label) => {
  //   const tag = document.createElement('span');
  //   tag.innerHTML = label;
  //   const [red, green, blue] = legend[label];
  //   tag.classList.add('column');
  //   tag.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
  //   tag.style.padding = '1em';
  //   tag.style.margin = '1em';
  //   tag.style.color = '#ffffff';

  //   legendList.appendChild(tag);
  // });
  // toggleInvisible('legend-card', false);

  // const inputContainer = document.getElementById('input-card');
  // inputContainer.scrollIntoView({behavior: 'smooth', block: 'nearest'});

  outEl.appendChild(canvas);
};