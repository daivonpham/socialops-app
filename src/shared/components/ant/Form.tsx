import { Form as AntForm } from 'antd'
import type { FormProps as AntFormProps } from 'antd'
import type { Rule, RuleObject } from 'antd/es/form'
import dayjs, { type Dayjs, type OpUnitType } from 'dayjs'
import { useMemo, type ComponentProps } from 'react'
import type { CountryCode } from 'libphonenumber-js'
import { isValidPhone } from '@/shared/lib/formatHelpers'

type AntFormComponentProps = ComponentProps<typeof AntForm>
export type FormProps<Values extends object = Record<string, unknown>> = Omit<
  AntFormProps<Values>,
  'onFinish'
> & {
  onFinish?: (values: Values) => void
}
type AntFormItemProps = ComponentProps<typeof AntForm.Item>

export type PhoneRuleInput = {
  type: 'phone'
  required?: boolean
  message?: RuleObject['message']
  defaultCountry?: CountryCode
}

export type FormRule = Rule | PhoneRuleInput
export type DateCompareUnit = Extract<OpUnitType, 'day' | 'minute' | 'second'>
export type DateAfterFieldOptions = { message?: string; unit?: DateCompareUnit }

function getPhoneRule(rule: FormRule): PhoneRuleInput | null {
  if (typeof rule !== 'object' || rule === null) return null
  const candidate = rule as PhoneRuleInput
  return candidate.type === 'phone' ? candidate : null
}

function toDayjs(value: unknown): Dayjs | null {
  if (value == null || value === '') return null
  if (dayjs.isDayjs(value)) return value.isValid() ? value : null
  const parsed = dayjs(value as string | Date)
  return parsed.isValid() ? parsed : null
}

export const createDateAfterRule = (afterField: string, options?: DateAfterFieldOptions): Rule => {
  const { message = 'The end date must be after or equal to the start date', unit = 'day' } =
    options ?? {}
  return ({ getFieldValue }) => ({
    validator(_, value: unknown) {
      const current = toDayjs(value)
      const reference = toDayjs(getFieldValue(afterField))
      if (
        !current ||
        !reference ||
        current.isSame(reference, unit) ||
        current.isAfter(reference, unit)
      ) {
        return Promise.resolve()
      }
      return Promise.reject(new Error(message))
    },
  })
}

export const createPhoneRule = (
  message = 'Invalid phone number',
  defaultCountry: CountryCode = 'VN',
): Rule => ({
  validator(_, value: unknown) {
    if (value == null || value === '') return Promise.resolve()
    return isValidPhone(value, defaultCountry)
      ? Promise.resolve()
      : Promise.reject(new Error(message))
  },
})

export const createEmailRule = (message = 'Invalid email address'): Rule => ({
  type: 'email',
  message,
})

export const createSameAsFieldRule =
  (field: string, message: string): Rule =>
  ({ getFieldValue }) => ({
    validator(_, value: unknown) {
      return value === getFieldValue(field) ? Promise.resolve() : Promise.reject(new Error(message))
    },
  })

function normalizeRules(rules?: FormRule[]): Rule[] | undefined {
  if (!rules) return rules
  return rules.flatMap((rule): Rule[] => {
    const phoneRule = getPhoneRule(rule)
    if (!phoneRule) return [rule as Rule]
    const message =
      typeof phoneRule.message === 'string' ? phoneRule.message : 'Invalid phone number'
    return [
      ...(phoneRule.required ? [{ required: true, message }] : []),
      createPhoneRule(message, phoneRule.defaultCountry),
    ]
  })
}

export type FormItemProps = Omit<AntFormItemProps, 'rules'> & {
  rules?: FormRule[]
  dateAfterField?: string
  dateAfterOptions?: DateAfterFieldOptions
}

function FormItem({
  dateAfterField,
  dateAfterOptions,
  rules,
  dependencies,
  ...rest
}: FormItemProps) {
  const mergedRules = useMemo(
    () => [
      ...(normalizeRules(rules) ?? []),
      ...(dateAfterField ? [createDateAfterRule(dateAfterField, dateAfterOptions)] : []),
    ],
    [dateAfterField, dateAfterOptions, rules],
  )
  const mergedDependencies = useMemo(() => {
    if (!dateAfterField) return dependencies
    const values = dependencies ?? []
    return values.includes(dateAfterField) ? values : [...values, dateAfterField]
  }, [dateAfterField, dependencies])

  return <AntForm.Item {...rest} rules={mergedRules} dependencies={mergedDependencies} />
}

function FormBase<Values extends object = Record<string, unknown>>(props: FormProps<Values>) {
  return <AntForm {...(props as AntFormComponentProps)} noValidate />
}

export const Form = Object.assign(FormBase, {
  Item: FormItem,
  List: AntForm.List,
  ErrorList: AntForm.ErrorList,
  Provider: AntForm.Provider,
  useForm: AntForm.useForm,
  useFormInstance: AntForm.useFormInstance,
  useWatch: AntForm.useWatch,
  rules: {
    dateAfter: createDateAfterRule,
    email: createEmailRule,
    phone: createPhoneRule,
    sameAs: createSameAsFieldRule,
  },
})
