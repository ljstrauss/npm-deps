module.exports = {


  friendlyName: 'Dependencies',


  description: 'Dependencies package.',


  inputs: {
    name: {
      type: 'string',
      description: 'The NPM package name'
    },
    version: {
      type: 'string',
      description: 'The NPM package version'
    }
  },


  exits: {
    notFound: {
      description: 'There is no NPM package with that name and version.',
      responseType: 'notFound'
    },
  },


  fn: async function ({name, version}) {
    const request = require('request-promise-native');

    // let's check if the package+version even exists...
    // do not rely on packageDependenciesResolver to determine notFound
    let npmResult;

    try {
      npmResult = await request({
        method: 'GET',
        uri: 'https://registry.npmjs.org/' + name + '/' + (version || 'latest'),
        json: true
      });
    }
    catch(e){}

    if (!npmResult) {
      throw 'notFound';
    }

    if (!version) {
      version = npmResult.version;
    }

    return sails.helpers.packageDependenciesResolver.with(({
      name,
      version
    }));

  }


};
