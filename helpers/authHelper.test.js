import {describe, jest, test, expect} from '@jest/globals'
import bcrypt from 'bcrypt'
import { hashPassword } from './authHelper';

describe('hashPassword method called', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('should return a hashed password', async () => {
    let bcryptSpy = jest.spyOn(bcrypt, 'hash')
    bcryptSpy.mockResolvedValue('hashedPassword#')
    jest.spyOn(console, 'log')

    let actualHashedPw = await hashPassword('password')

    expect(bcrypt.hash).toHaveBeenCalledTimes(1)
    expect(console.log).not.toHaveBeenCalled()
    expect(actualHashedPw).toBeTruthy()
  });

  test('should return an error', async () => {
    let bcryptSpy = jest.spyOn(bcrypt, 'hash')
    bcryptSpy.mockRejectedValue('error')
    jest.spyOn(console, 'log')

    let actualHashedPw = await hashPassword('password')

    expect(bcrypt.hash).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith('error')
    expect(actualHashedPw).toBeUndefined()
  });
})