import { useRef } from 'react'
import { FormBuilder } from 'fjorm'
import 'fjorm/dist/index.css'
import { getTalentLensFormConfig } from './talentLensFormConfig'

function FormBuilderEditor({ initialData, onStructureChange, builderRef: externalRef }) {
  const internalRef = useRef(null)
  const builderRef = externalRef || internalRef
  const config = getTalentLensFormConfig()

  return (
    <div className="talentlens-form-builder h-[min(72vh,720px)] min-h-[480px]">
      <FormBuilder
        ref={builderRef}
        config={config}
        initialData={initialData}
        onChange={onStructureChange}
      />
    </div>
  )
}

export default FormBuilderEditor
