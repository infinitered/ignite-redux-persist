// Ignite CLI plugin for ReduxPersist
// ----------------------------------------------------------------------------

const NPM_MODULE_NAME = 'redux-persist'
const NPM_MODULE_VERSION = '^5.4.0'

const PLUGIN_PATH = __dirname
const APP_PATH = process.cwd()

const add = async function (context) {
  const { ignite, filesystem } = context

  // install an NPM module and link it
  await ignite.addModule(NPM_MODULE_NAME, { version: NPM_MODULE_VERSION })

  // ensure supporting modules
  await ignite.addModule('ramda')
  await ignite.addModule('seamless-immutable')

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

  // add config
  if (!filesystem.exists(`${APP_PATH}/Config/ReduxPersist.js`)) {
    filesystem.copy(
      `${PLUGIN_PATH}/templates/ReduxPersist.js`,
      `${APP_PATH}/App/Config/ReduxPersist.js`
    )
  }

  // patch CreateStore.js
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    insert: `import ReduxPersist from '../Config/ReduxPersist'`,
    after: `from 'redux'`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    insert: `import Rehydration from '../Services/Rehydration'`,
    after: `from 'redux'`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    insert: `
  // configure persistStore and check reducer version number
  if (ReduxPersist.active) {
    Rehydration.updateReducers(store)
  }`,
    after: `const store`
  })

  // patch Redux/index.js
  ignite.patchInFile(`${APP_PATH}/App/Redux/index.js`, {
    insert: `import { persistReducer } from 'redux-persist'`,
    after: `from 'redux'`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/index.js`, {
    insert: `import ReduxPersist from '../Config/ReduxPersist'`,
    after: `from '../Sagas/'`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/index.js`, {
    insert: `
    let finalReducers = reducers
    // If rehydration is on use persistReducer otherwise default combineReducers
    if (ReduxPersist.active) {
      const persistConfig = ReduxPersist.storeConfig
      finalReducers = persistReducer(persistConfig, reducers)
    }`,
    after: `export const reducers`
  })
  ignite.patchInFile(`${APP_PATH}/App/Containers/RootContainer.js`, {
    replace: `let { store, sagasManager, sagaMiddleware } = configureStore(reducers, rootSaga)`,
    insert: `let { store, sagasManager, sagaMiddleware } = configureStore(finalReducers, rootSaga)`
  })

  // patch RootContainer.js
  ignite.patchInFile(`${APP_PATH}/App/Containers/RootContainer.js`, {
    insert: `import ReduxPersist from '../Config/ReduxPersist'`,
    after: `from '../Redux/StartupRedux'`
  })
  ignite.patchInFile(`${APP_PATH}/App/Containers/RootContainer.js`, {
    insert: `  componentDidMount () {
    // if redux persist is not active fire startup action
    if (!ReduxPersist.active) {
      this.props.startup()
    }
  }`,
    replace: `  componentDidMount () {
    this.props.startup()
  }`
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
    filesystem.remove(`${APP_PATH}/App/Config/ReduxPersist.js`)
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
    delete: `import Rehydration from '../Services/Rehydration'\n`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/CreateStore.js`, {
    delete: `
  // configure persistStore and check reducer version number
  if (ReduxPersist.active) {
    Rehydration.updateReducers(store)
  }\n`
  })

  // unpatch Redux/index.js
  ignite.patchInFile(`${APP_PATH}/App/Redux/index.js`, {
    delete: `import { persistReducer } from 'redux-persist'\n`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/index.js`, {
    delete: `import ReduxPersist from '../Config/ReduxPersist'\n`
  })
  ignite.patchInFile(`${APP_PATH}/App/Redux/index.js`, {
    delete: `
    let finalReducers = reducers
    // If rehydration is on use persistReducer otherwise default combineReducers
    if (ReduxPersist.active) {
      const persistConfig = ReduxPersist.storeConfig
      finalReducers = persistReducer(persistConfig, reducers)
    }\n`
  })
  ignite.patchInFile(`${APP_PATH}/App/Containers/RootContainer.js`, {
    replace: `let { store, sagasManager, sagaMiddleware } = configureStore(finalReducers, rootSaga)`,
    insert: `let { store, sagasManager, sagaMiddleware } = configureStore(reducers, rootSaga)`
  })

  // unpatch RootContainer.js
  ignite.patchInFile(`${APP_PATH}/App/Containers/RootContainer.js`, {
    delete: `import ReduxPersist from '../Config/ReduxPersist'\n`
  })
  ignite.patchInFile(`${APP_PATH}/App/Containers/RootContainer.js`, {
    replace: `  componentDidMount () {
    // if redux persist is not active fire startup action
    if (!ReduxPersist.active) {
      this.props.startup()
    }
  }`,
    insert: `  componentDidMount () {
    this.props.startup()
  }`
  })
}

// Required in all Ignite CLI plugins
module.exports = { add, remove }
