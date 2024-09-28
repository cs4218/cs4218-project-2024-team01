import {describe, jest, test, expect} from '@jest/globals'
import bcrypt from 'bcrypt'
import { hashPassword } from './authHelper';

jest.mock('bcrypt')

describe('hashPassword method called', () => {
  test('should return a hashed password', async () => {
    bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword#')
    jest.spyOn(console, 'log')

    let actualHashedPw = await hashPassword('password')

    expect(bcrypt.hash).toHaveBeenCalledTimes(1)
    expect(console.log).not.toHaveBeenCalled()
    expect(actualHashedPw).toBeTruthy()
  });

  test('should return an error', async () => {
    bcrypt.hash = jest.fn().mockRejectedValue('error')
    jest.spyOn(console, 'log')

    let actualHashedPw = await hashPassword('password')

    expect(bcrypt.hash).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith('error')
    expect(actualHashedPw).toBeUndefined()
  });
})