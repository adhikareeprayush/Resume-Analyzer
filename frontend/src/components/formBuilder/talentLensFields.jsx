import {
  EditorCheckbox,
  EditorInput,
  EditorOptions,
  FormComponentEditorContainer,
  useEditorChange
} from 'fjorm'

function DropdownEditor({ settings, options, onValueChange, onChangeOptions }) {
  const handleOnChange = useEditorChange(onValueChange)

  return (
    <FormComponentEditorContainer>
      <EditorInput settings={settings} name="label" label="Label" handleOnChange={handleOnChange} />
      <EditorInput settings={settings} name="placeholder" label="Placeholder" handleOnChange={handleOnChange} />
      <EditorCheckbox settings={settings} name="required" label="Required" handleOnChange={handleOnChange} />
      <EditorOptions
        label="Options"
        name="options"
        options={options}
        handleOnChangeOptions={onChangeOptions}
      />
    </FormComponentEditorContainer>
  )
}

function FieldShell({ label, required, children }) {
  return (
    <div className="grid gap-2">
      {label ? (
        <span className="field-label">
          {label}
          {required ? <span className="text-signal"> *</span> : null}
        </span>
      ) : null}
      {children}
    </div>
  )
}

function ReadOnlyControl({ editMode, children }) {
  if (!editMode) return children
  return <div className="pointer-events-none opacity-90">{children}</div>
}

function ShortTextField({ label, settings, editMode }) {
  return (
    <FieldShell label={label} required={settings.required}>
      <ReadOnlyControl editMode={editMode}>
        <input
          type="text"
          className="field-input"
          placeholder={settings.placeholder}
          disabled={editMode}
          readOnly={editMode}
        />
      </ReadOnlyControl>
    </FieldShell>
  )
}

function EmailField({ label, settings, editMode }) {
  return (
    <FieldShell label={label} required={settings.required}>
      <ReadOnlyControl editMode={editMode}>
        <input
          type="email"
          className="field-input"
          placeholder={settings.placeholder || 'you@email.com'}
          disabled={editMode}
          readOnly={editMode}
        />
      </ReadOnlyControl>
    </FieldShell>
  )
}

function PhoneField({ label, settings, editMode }) {
  return (
    <FieldShell label={label} required={settings.required}>
      <ReadOnlyControl editMode={editMode}>
        <input
          type="tel"
          className="field-input"
          placeholder={settings.placeholder || '+1 ...'}
          disabled={editMode}
          readOnly={editMode}
        />
      </ReadOnlyControl>
    </FieldShell>
  )
}

function LongTextField({ label, settings, editMode }) {
  return (
    <FieldShell label={label} required={settings.required}>
      <ReadOnlyControl editMode={editMode}>
        <textarea
          className="field-input min-h-28 py-3"
          placeholder={settings.placeholder}
          disabled={editMode}
          readOnly={editMode}
        />
      </ReadOnlyControl>
    </FieldShell>
  )
}

function DropdownField({ label, settings, options, editMode }) {
  return (
    <FieldShell label={label} required={settings.required}>
      <ReadOnlyControl editMode={editMode}>
        <select className="field-input" disabled={editMode}>
          <option value="">Select…</option>
          {(options || []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.title}
            </option>
          ))}
        </select>
      </ReadOnlyControl>
    </FieldShell>
  )
}

function FileUploadField({ label, settings, editMode }) {
  return (
    <FieldShell label={label} required={settings.required}>
      <ReadOnlyControl editMode={editMode}>
        <input
          type="file"
          accept={settings.accept || '.pdf,.docx,.txt'}
          className="field-input py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-paper"
          disabled={editMode}
        />
      </ReadOnlyControl>
    </FieldShell>
  )
}

function CheckboxField({ settings, editMode }) {
  return (
    <ReadOnlyControl editMode={editMode}>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/10 bg-surface px-4 py-3">
        <input type="checkbox" className="mt-1" disabled={editMode} />
        <span className="text-sm leading-6 text-ink">
          {settings.label}
          {settings.required ? <span className="text-signal"> *</span> : null}
        </span>
      </label>
    </ReadOnlyControl>
  )
}

function ToolboxIcon({ children }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper text-sm font-bold text-ink">
      {children}
    </span>
  )
}

const baseEditor = {
  label: 'EditorInput',
  placeholder: 'EditorInput',
  required: 'EditorCheckbox'
}

export const talentLensFormComponents = [
  {
    key: 'ShortText',
    icon: () => <ToolboxIcon>Aa</ToolboxIcon>,
    settings: { label: 'Short text', name: 'short_text', required: false, placeholder: '' },
    component: ShortTextField,
    editor: baseEditor
  },
  {
    key: 'Email',
    icon: () => <ToolboxIcon>@</ToolboxIcon>,
    settings: { label: 'Email', name: 'email', required: true, placeholder: 'you@email.com' },
    component: EmailField,
    editor: baseEditor
  },
  {
    key: 'Phone',
    icon: () => <ToolboxIcon>☎</ToolboxIcon>,
    settings: { label: 'Phone', name: 'phone', required: false, placeholder: '+1 ...' },
    component: PhoneField,
    editor: baseEditor
  },
  {
    key: 'LongText',
    icon: () => <ToolboxIcon>¶</ToolboxIcon>,
    settings: { label: 'Long answer', name: 'long_text', required: false, placeholder: '' },
    component: LongTextField,
    editor: baseEditor
  },
  {
    key: 'Dropdown',
    icon: () => <ToolboxIcon>▾</ToolboxIcon>,
    settings: { label: 'Dropdown', name: 'dropdown', required: false },
    component: DropdownField,
    editor: DropdownEditor,
    options: [
      { id: 'opt-1', title: 'Option 1', value: 'Option 1' },
      { id: 'opt-2', title: 'Option 2', value: 'Option 2' }
    ]
  },
  {
    key: 'FileUpload',
    icon: () => <ToolboxIcon>↑</ToolboxIcon>,
    settings: {
      label: 'File upload',
      name: 'file',
      required: true,
      accept: '.pdf,.docx,.txt'
    },
    component: FileUploadField,
    editor: {
      label: 'EditorInput',
      required: 'EditorCheckbox',
      accept: 'EditorInput'
    }
  },
  {
    key: 'Checkbox',
    icon: () => <ToolboxIcon>☑</ToolboxIcon>,
    settings: {
      label: 'I confirm the information provided is accurate',
      name: 'checkbox',
      required: true
    },
    component: CheckboxField,
    editor: {
      label: 'EditorInput',
      required: 'EditorCheckbox'
    }
  }
]
