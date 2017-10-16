const test = require('ava')
const sinon = require('sinon')
const plugin = require('../plugin')

test('adds the proper npm module', async t => {
  // spy on few things so we know they're called
  const addModule = sinon.spy()
  const copy = sinon.spy()
  const exists = sinon.spy()
  const patchInFile = sinon.spy()

  // mock a context
  const context = {
    ignite: { addModule, patchInFile },
    filesystem: { copy, exists }
  }

  await plugin.add(context)

  t.true(addModule.calledWith('redux-persist'))
  t.true(addModule.calledWith('ramda'))
  t.true(addModule.calledWith('seamless-immutable'))
})
