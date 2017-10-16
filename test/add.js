const test = require('ava')
const sinon = require('sinon')
const plugin = require('../plugin')

test('adds the proper npm module', async t => {
  // spy on few things so we know they're called
  const addModule = sinon.spy()

  // mock a context
  const context = {
    ignite: { addModule }
  }

  await plugin.add(context)

  t.true(addModule.calledWith('redux-persist'))
})
