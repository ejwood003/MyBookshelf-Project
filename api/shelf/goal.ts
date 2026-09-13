/** GET and PUT /api/shelf/goal — the reader's yearly target. */

import { body, hasErrors, json, requireInt, route, validationProblem, type ValidationErrors } from '../_lib/http'
import { getGoal, setGoal } from '../_lib/shelf'

export default route({
  GET: async (_req, res) => json(res, 200, await getGoal()),

  PUT: async (req, res) => {
    const errors: ValidationErrors = {}
    const targetBooks = requireInt(errors, 'TargetBooks', body(req).targetBooks, {
      min: 1,
      max: 500,
      message: 'Pick a goal between 1 and 500 books.',
    })

    if (hasErrors(errors)) return validationProblem(res, errors)

    json(res, 200, await setGoal(targetBooks))
  },
})
