This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

```
nodes = [];document.querySelectorAll('.collection-photo').forEach(n => nodes.push({src: n.src, alt: n.getAttribute('alt')})); console.log(JSON.stringify(nodes));
```

```
$ (install deeplab, publish-local)
$ yarn install
$ yarn link-local
```

```
./fetch.sh
```

0. `?disable-fetching-images&no-localforage`

1. Fetch images
1. Clear localforage cache (`?disabled&clear-localforage`)
2. Run locally to build masks, with cache enabled (`?disable-fetching-images`)
3. Do this over the whole data set (eg, 30 at a time).
4. Get the localforage dump, write it to `cached.json`
5. Run force download to get all the masks, put them in the `masks` folder.
6. Done!
