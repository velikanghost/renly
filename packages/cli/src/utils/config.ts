import Conf from 'conf'

interface ConfigSchema {
  token?: string
}

const config = new Conf<ConfigSchema>({
  projectName: '@renly/cli',
})

export const getStoredToken = () => config.get('token')
export const setStoredToken = (token: string) => config.set('token', token)
export const removeStoredToken = () => config.delete('token')
export const clearConfig = () => config.clear()
