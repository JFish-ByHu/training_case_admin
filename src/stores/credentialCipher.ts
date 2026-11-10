const DATABASE_NAME = 'demo_admin_credentials'
const STORE_NAME = 'keys'
const KEY_NAME = 'remembered_password'

function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getCredentialKey(): Promise<CryptoKey> {
  const candidate = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt'
  ])
  const database = await openKeyDatabase()
  try {
    return await new Promise<CryptoKey>((resolve, reject) => {
      let key = candidate
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(KEY_NAME)
      request.onsuccess = () => {
        if (request.result) key = request.result as CryptoKey
        else store.put(candidate, KEY_NAME)
      }
      transaction.oncomplete = () => resolve(key)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    database.close()
  }
}

function encodeBytes(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
}

function decodeBytes(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0))
}

export async function encryptPassword(password: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getCredentialKey()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(password)
  )
  return { iv: encodeBytes(iv), ciphertext: encodeBytes(new Uint8Array(encrypted)) }
}

export async function decryptPassword(iv: string, ciphertext: string): Promise<string> {
  const key = await getCredentialKey()
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBytes(iv) },
    key,
    decodeBytes(ciphertext)
  )
  return new TextDecoder().decode(decrypted)
}
