module.exports = {


  friendlyName: 'Package dependencies resolver',


  description: 'Resolves an NPM package dependencies',


  inputs: {
    name: {
      type: 'string',
      required: true
    },
    version: {
      type: 'string'
    },
    recursive: {
      type: 'boolean',
      description: 'This should always be false if the function is not calling itself'
    }
  },


  exits: {

    success: {
      description: 'Resolved dependencies.',
    },

  },


  fn: async function ({name, version, recursive}) {
    const request = require('request-promise-native');

    //TODO you can try and just query the db (and/or redis) at this point to bypass hitting npm

    try {
      const npmResult = await request({
        method: 'GET',
        uri: 'https://registry.npmjs.org/' + name + '/' + version,
        json: true
      });
      const npmDeps = npmResult.dependencies ?
        Object.keys(npmResult.dependencies)
          .map(k => ({
            name: k,
            version: npmResult.dependencies[k]
          })) :
        [];

      const recursiveNpmDeps = await Promise.all(
        npmDeps.map(d => sails.helpers.packageDependenciesResolver.with(({
          name: d.name,
          version: singlePatchVersion(d.version),
          recursive: true
        })))
      );

      //TODO try saving in the db (and/or redis), so that next time, we can just query db.

      const allDeps = npmDeps.concat(recursiveNpmDeps);

      // on a recursive call, just return the array
      // on an initial call, reduce to a dependencies object (to match npm format).
      return recursive ?
        allDeps :
        _.flattenDeep(allDeps)
          .reduce((dict, dep) => ({
            ...dict,
            [dep.name]: dict[dep.name] ? lowerVersion2(dict[dep.name], dep.version) : dep.version
          }), {});
    }
    catch(e) {
      return [];
    }
  }
};

function singlePatchVersion(version) {
  const split = version.split('||');
  return patchVersion(lowerVersionN(split));
}

function lowerVersionN(versions) {
  if (versions.length < 2) {
    return versions[0];
  }

  let result;
  for (let v = 0; v < versions.length; v++) {
    result = v === 0 ? versions[0] : lowerVersion2(result, versions[v]);
  }
  return result;
}

function lowerVersion2(v1, v2) {
  const v1Num = singlePatchVersion(v1);
  const v2Num = singlePatchVersion(v2);

  if (v1Num === v2Num) {
    return v1;
  }

  const v1Split = v1Num.split('.').map(s => parseInt(s));
  const v2Split = v2Num.split('.').map(s => parseInt(s));

  for (let i = 0; i <= 2; i++) {
    if (v1Split[i] !== v2Split[i]) {
      return v1Split[i] < v2Split[i] ? v1 : v2;
    }
  }

  // we should never get here... because
  // equality is taken care of in the beginning of the function
  // non-quality should be taken care of in the loop
  throw new Error('lowerVersion error with ' + v1 + ' ' + v2);
}

function patchVersion(version) {
  return version.trim().replace(/[^0-9$.]/g, '');
}
