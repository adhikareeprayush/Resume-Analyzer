const TYPE_TO_KEY = {
  text: 'ShortText',
  email: 'Email',
  phone: 'Phone',
  textarea: 'LongText',
  select: 'Dropdown',
  file: 'FileUpload',
  checkbox: 'Checkbox'
}

const KEY_TO_TYPE = Object.fromEntries(Object.entries(TYPE_TO_KEY).map(([type, key]) => [key, type]))

export function appFieldToFjormItem(field) {
  const key = TYPE_TO_KEY[field.type] || 'ShortText'

  const item = {
    id: field.id,
    key,
    settings: {
      label: field.label,
      name: field.id,
      required: Boolean(field.required),
      placeholder: field.placeholder || ''
    }
  }

  if (field.type === 'file' && field.accept) {
    item.settings.accept = field.accept
  }

  if (field.type === 'select' && field.options?.length) {
    item.options = field.options.map((opt, index) => ({
      id: `${field.id}-opt-${index}`,
      title: opt,
      value: opt
    }))
  }

  return item
}

export function appFieldsToFjormData(fields = []) {
  return fields.map(appFieldToFjormItem)
}

export function fjormItemToAppField(item) {
  const type = KEY_TO_TYPE[item.key]
  if (!type) return null

  const field = {
    id: item.id,
    type,
    label: item.settings?.label || 'Untitled',
    required: Boolean(item.settings?.required),
    placeholder: item.settings?.placeholder || ''
  }

  if (type === 'select') {
    field.options = (item.options || []).map((opt) => opt.title || opt.value).filter(Boolean)
  }

  if (type === 'file' && item.settings?.accept) {
    field.accept = item.settings.accept
  }

  return field
}

export function fjormDataToAppFields(items = []) {
  const flat = []

  const walk = (list) => {
    list.forEach((item) => {
      if (item.children?.length) {
        walk(item.children)
        return
      }
      const field = fjormItemToAppField(item)
      if (field) flat.push(field)
    })
  }

  walk(items)
  return flat
}

export const DEFAULT_APPLICATION_FIELDS = [
  { id: 'f-name', type: 'text', label: 'Full name', required: true, placeholder: 'Your full name' },
  { id: 'f-email', type: 'email', label: 'Email address', required: true, placeholder: 'you@email.com' },
  { id: 'f-phone', type: 'phone', label: 'Phone number', required: false, placeholder: '+1 ...' },
  { id: 'f-resume', type: 'file', label: 'Upload resume', required: true, accept: '.pdf,.docx,.txt' }
]
