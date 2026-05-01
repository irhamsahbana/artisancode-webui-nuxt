import { defineComponent, h } from 'vue'

export const ButtonStub = defineComponent({
  name: 'Button',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('button', attrs, slots.default?.())
  },
})

export const InputStub = defineComponent({
  name: 'Input',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () => h('input', {
      ...attrs,
      value: props.modelValue,
      onInput: (event: Event) => {
        emit('update:modelValue', (event.target as HTMLInputElement).value)
      },
    })
  },
})

export const LabelStub = defineComponent({
  name: 'Label',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('label', attrs, slots.default?.())
  },
})

const createWrapperStub = (name: string, tag = 'div') => defineComponent({
  name,
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(tag, attrs, slots.default?.())
  },
})

export const roleComponentStubs = {
  Badge: createWrapperStub('Badge', 'span'),
  Button: ButtonStub,
  Card: createWrapperStub('Card'),
  CardContent: createWrapperStub('CardContent'),
  CardFooter: createWrapperStub('CardFooter'),
  CardHeader: createWrapperStub('CardHeader'),
  CardTitle: createWrapperStub('CardTitle', 'h2'),
  Input: InputStub,
  Label: LabelStub,
  Table: createWrapperStub('Table', 'table'),
  TableBody: createWrapperStub('TableBody', 'tbody'),
  TableCell: createWrapperStub('TableCell', 'td'),
  TableHead: createWrapperStub('TableHead', 'th'),
  TableHeader: createWrapperStub('TableHeader', 'thead'),
  TableRow: createWrapperStub('TableRow', 'tr'),
}
