# segmented

## dev setup
### deeplab
```
$ (install deeplab, publish-local)
$ yarn install
$ yarn link-local
```

### Prep images
1. Get info
```
nodes = [];document.querySelectorAll('.collection-photo').forEach(n => nodes.push({src: n.src, alt: n.getAttribute('alt')})); console.log(JSON.stringify(nodes));
```
2. Fetch images (`./fetch.sh`)
3. Resize (eg `cd public/img && mogrify -resize x224 -path ../img-resized *.*`)


### Prep masks
This builds the masks in the browser, writes them to disk with localforage, then forces downloading them
to yield all the actual files.  Then post-processing to resize and move into source for reading in production.

1. Clear localforage cache (`?disabled&clear-localforage`)
2. Run locally to build masks, with cache enabled, over the whole dataset (`?disable-fetching-images`)
4. Get the localforage dump, write it to `cached.json`
5. Run force download to get all the masks (`?disable-fetching-images&force-download-for-dev`), put them in the `masks` folder.
6. Resize (eg `mkdir -p public/masks/v4-resized && cd public/masks/v4 && mogrify -resize x224 -path ../v4-resized *.*`)
7. Verify it works.
8. Clear localforage cache (`?disabled&clear-localforage`)


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).