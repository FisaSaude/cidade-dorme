/**
 * O JSON Server 0.17 não cria recursos em PUT: ele responde 404 quando o ID
 * ainda não existe. A aplicação gera o ID da partida no cliente e depende de
 * PUT idempotente (criar na primeira gravação, substituir nas tentativas).
 * Este middleware converte o primeiro PUT /matches/:id em POST /matches,
 * preservando o ID enviado no corpo. PUTs seguintes continuam normais.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function upsertMatchOnPut(req, res, next) {
  if (req.method !== 'PUT') {
    next()
    return
  }

  const match = /^\/matches\/([^/?]+)\/?$/.exec(req.path)

  if (!match) {
    next()
    return
  }

  const id = decodeURIComponent(match[1])
  const existing = req.app.db.get('matches').getById(id).value()

  if (existing) {
    next()
    return
  }

  req.method = 'POST'
  req.url = '/matches'
  next()
}

module.exports = [upsertMatchOnPut]
