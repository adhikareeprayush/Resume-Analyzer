import { Config } from 'fjorm'
import { talentLensFormComponents } from './talentLensFields'

let configInstance = null

export function getTalentLensFormConfig() {
  if (!configInstance) {
    configInstance = new Config()
    configInstance.addComponents(talentLensFormComponents)
  }
  return configInstance
}
