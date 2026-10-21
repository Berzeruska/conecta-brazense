/**
 * Reduz a foto tirada no celular (que pode ter 5 MB) para um JPEG leve,
 * que cabe no localStorage.
 */
export function comprimirImagem(arquivo: File, lado = 900, qualidade = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo)
    const img = new Image()
    img.onload = () => {
      const escala = Math.min(1, lado / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * escala)
      canvas.height = Math.round(img.height * escala)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('canvas indisponível'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', qualidade))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('não foi possível abrir a imagem'))
    }
    img.src = url
  })
}
