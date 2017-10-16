const test = require('ava')
const sinon = require('sinon')
const plugin = require('../plugin')

test('removes redux persist', async t => {
  const confirm = sinon.spy()
  const exists = sinon.spy()
  const remove = sinon.spy()
  const removeModule = sinon.spy()
  const patchInFile = sinon.spy()

  // mock a context
  const context = {
    ignite: { removeModule, patchInFile },
    filesystem: { remove, exists },
    prompt: { confirm }
  }

  await plugin.remove(context)

  t.true(removeModule.calledWith('redux-persist'))
})
