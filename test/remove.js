const test = require('ava')
const sinon = require('sinon')
const plugin = require('../plugin')

test('removes redux persist', async t => {
  const removeModule = sinon.spy()

  const context = {
    ignite: { removeModule }
  }

  await plugin.remove(context)

  t.true(removeModule.calledWith('redux-persist'))
})
