import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DIST_DIR = path.join(__dirname, 'dist')
const PORT = process.env.PORT || 5173

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
}

const server = http.createServer((req, res) => {
  // Remove query params
  const urlPath = req.url.split('?')[0]
  let safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '')
  let filePath = path.join(DIST_DIR, safePath)

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        // Fallback SPA para index.html
        fs.readFile(path.join(DIST_DIR, 'index.html'), (spaErr, spaData) => {
          if (spaErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
            res.end('404 - Arquivo não encontrado. Execute "npm run build" primeiro.')
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(spaData)
        })
        return
      }

      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(data)
    })
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`)
  console.log(`  RPsec Balcao - Servidor Leve de Producao Ativo!`)
  console.log(`  Acesse localmente: http://localhost:${PORT}`)
  console.log(`  Para fechar o servidor: pressione Ctrl + C`)
  console.log(`======================================================\n`)
})
