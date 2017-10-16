// Ignite CLI plugin for ReduxPersist
// ----------------------------------------------------------------------------

const NPM_MODULE_NAME = 'redux-persist'
const NPM_MODULE_VERSION = '^4.1.0'

const PLUGIN_PATH = __dirname
const APP_PATH = process.cwd()

const add = async function (context) {
  const { ignite, filesystem } = context

  // install an NPM module and link it
  await ignite.addModule(NPM_MODULE_NAME, { version: NPM_MODULE_VERSION })

  // ensure supporting modules
  await ignite.addModule('ramda')
  await ignite.addModule('seamless-immutable')

  // add config
  if (!filesystem.exists(`${APP_PATH}/Config/ReduxPersist.js`)) {
    filesystem.copy(
      `${PLUGIN_PATH}/templates/ReduxPersist.js`,
      `${APP_PATH}/Config/ReduxPersist.js`
    )
  }

  // add immutable persistence transform service
  if (!filesystem.exists(`${APP_PATH}/App/Services/ImmutablePersistenceTransform.js`)) {
    filesystem.copy(
      `${PLUGIN_PATH}/templates/ImmutablePersistenceTransform.js`,
      `${APP_PATH}/App/Services/ImmutablePersistenceTransform.js`
    )
  }

  // add rehydration service
  if (!filesystem.exists(`${APP_PATH}/App/Services/Rehydration.js`)) {
    filesystem.copy(
      `${PLUGIN_PATH}/templates/Rehydration.js`,
      `${APP_PATH}/App/Services/Rehydration.js`
    )
  }

  // patch CreateStore.js
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    insert: `import ReduxPersist from '../Config/ReduxPersist'`,
    after: `from 'redux'`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    insert: `import RehydrationServices from '../Services/RehydrationServices'`,
    after: `from 'redux'`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    insert: `import { autoRehydrate } from 'redux-persist'`,
    after: `from 'redux'`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    insert: `\n  /* ------------- AutoRehydrate Enhancer ------------- */

  // add the autoRehydrate enhancer
  if (ReduxPersist.active) {
    enhancers.push(autoRehydrate())
  }`,
    after: `applyMiddleware\(.+middleware\)`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    insert: `
  // configure persistStore and check reducer version number
  if (ReduxPersist.active) {
    RehydrationServices.updateReducers(store)
  }`,
    after: `const store`
  })
}

const remove = async function (context) {
  const { ignite, filesystem } = context

  // remove the npm module
  await ignite.removeModule(NPM_MODULE_NAME)

  // remove immutable persistence transform service
  const removeConfig = await context.prompt.confirm(
    'Do you want to remove Config/ReduxPersist.js?'
  )
  if (removeConfig) {
    filesystem.remove(`${APP_PATH}/Config/ReduxPersist.js`)
  }

  // remove immutable persistence transform service
  const removePersistenceTransform = await context.prompt.confirm(
    'Do you want to remove App/Services/ImmutablePersistenceTransform.js?'
  )
  if (removePersistenceTransform) {
    filesystem.remove(`${APP_PATH}/App/Services/ImmutablePersistenceTransform.js`)
  }

  // remove rehydration service
  const removeRehydration = await context.prompt.confirm(
    'Do you want to remove App/Services/Rehydration.js?'
  )
  if (removeRehydration) {
    filesystem.remove(`${APP_PATH}/App/Services/Rehydration.js`)
  }

  // unpatch CreateStore.js
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    delete: `import ReduxPersist from '../Config/ReduxPersist'\n`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    delete: `import RehydrationServices from '../Services/RehydrationServices'\n`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    delete: `import { autoRehydrate } from 'redux-persist'\n`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    delete: `\n  /* ------------- AutoRehydrate Enhancer ------------- */

  // add the autoRehydrate enhancer
  if (ReduxPersist.active) {
    enhancers.push(autoRehydrate())
  }\n`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    delete: `
  // configure persistStore and check reducer version number
  if (ReduxPersist.active) {
    RehydrationServices.updateReducers(store)
  }\n`
  })
}

// Required in all Ignite CLI plugins
module.exports = { add, remove }
