# multilevel

Expose a levelDB over the network, to be used by multiple process.

## Installing

```bash
npm install @bkrith/multilevel
```

## Usage

Create a Server and start listening:

```javascript
const multilevel = require('@bkrith/multilevel');

const db = new multilevel();

db.listen({ port: 22500 });
```

Connect from the client and use all the leveldb commands as promises:

```javascript
const multilevel = require('@bkrith/multilevel');

const db = new multilevel();

db.connect({
    address: '127.0.0.1',
    port: 22500
});

db.get('foo')
.then((value) => {
    console.log(value);
})
.catch((err) => {
    console.log(err);
});
```

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc

