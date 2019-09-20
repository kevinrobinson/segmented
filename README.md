This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

```
nodes = [];document.querySelectorAll('.collection-photo').forEach(n => nodes.push({src: n.src, alt: n.getAttribute('alt')})); console.log(JSON.stringify(nodes));
```

```
$ (install deeplab, publish-local)
$ yarn install
$ yarn link-local
```