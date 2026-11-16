import { describe, expect, it } from 'vitest'
import { formatCityLabel } from './cities'

describe('formatCityLabel', () => {
  it.each([
    ['Ho Chi Minh City, Vietnam', 'Thành phố Hồ Chí Minh'],
    ['Hanoi, Vietnam', 'Hà Nội'],
    ['Biên Hòa, Đồng Nai Province, Vietnam', 'Biên Hòa, Đồng Nai'],
    ['Da Nang, Vietnam', 'Đà Nẵng'],
    ['Hai Phong, Haiphong, Vietnam', 'Hải Phòng'],
    ['Quang Nam, Quảng Nam Province, Vietnam', 'Quảng Nam'],
    ['Dĩ An, Bình Dương Province, Vietnam', 'Dĩ An, Bình Dương'],
  ])('shortens %s the way Facebook shows it in Vietnamese', (name, label) => {
    expect(formatCityLabel(name, 'vi-VN')).toBe(label)
  })

  it('keeps English names in English, without the country or "Province"', () => {
    expect(formatCityLabel('Ho Chi Minh City, Vietnam', 'en-US')).toBe('Ho Chi Minh City')
    expect(formatCityLabel('Biên Hòa, Đồng Nai Province, Vietnam', 'en-US')).toBe(
      'Biên Hòa, Đồng Nai',
    )
  })

  it('leaves a lone name as it is', () => {
    expect(formatCityLabel('Bangkok', 'vi-VN')).toBe('Bangkok')
  })
})
