import { CreateUserDto } from '@modules/users';
import { generateValidUser } from '@modules/users/tests/user-tests.helpers';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validateSync } from 'class-validator';

describe('user validator test', () => {
  describe('CreateUserDto validator test', () => {
    test('validation should be correct when EMAIL is valid', () => {
      const emails: string[] = [
        'email@domain.com',
        'email@domain.com',
        'firstname.lastname@domain.com',
        'email@subdomain.domain.com',
        'firstname+lastname@domain.com',
        '"email"@domain.com',
        '1234567890@domain.com',
        'email@domain-one.com',
        '_______@domain.com',
        'email@domain.name',
      ];
      for (const email of emails) {
        const user = { ...generateValidUser(), email };
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(0);
      }
    });

    test('validation should be incorrect when EMAIL is invalid', () => {
      const emails: Array<string | null | undefined> = [
        null,
        undefined,
        '',
        '  ',
        'invalid email',
        'email',
        'email.domain.com',
        'email@',
        '@domain.com',
        'email@domain',
        'email@domain.',
        'email @domain.com',
        'email@ domain.com',
        'dd@dd@domain.com',
        'a"b(c)d,e:f;g<h>i[jk]l@domain.com',
        'just"not"right@domain.com',
        'this is"notallowed@domain.com',
        'this\nisnotallowed@domain.com',
        'this\nis"notallowed@domain.com',
        '”(),:;<>[\\]@domain.com',
        '#@%^%#$@#$@#.com',
        'Joe Smith <JoeSmith@domain.com>',
        '.email@domain.com',
        'email.@domain.com',
        'email..email@domain.com',
        'JoeSmith@domain.com (Joe Smith)',
        'email@-domain.com',
        'email@.domain.com',
        'email@111.222.333.44444',
        'email@domain..com',
        'Abc..123@domain.com',
        'much.”more\\ unusual”@domain.com',
        'very.unusual.”@”.unusual.com@domain.com',
        'very.”(),:;<>[]”.VERY.”very@\\ "very”.unusual@strange.domain.com',
        'email@123.123.123.123',
        'email@[123.123.123.123]',
        'more_than_100_chars_email_looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong@domain.com',
      ];
      for (const email of emails) {
        const user = { ...generateValidUser(), email };
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(1);
        expect(validationResult[0].property).toBe('email');
      }
    });

    test('validation should be correct when PHONE is valid', () => {
      const phones: string[] = [
        '221234567',
        '22 1234567',
        '+48 22 1234567',
        '+48 221234567',
        '+48221234567',
        '456123123',
        '456 123 456',
        '+48 456 456 456',
        '+48 456123456',
        '+48456123456',
        '+ 48456123123',
        '+ 48 456123123',
        '+ 48 456 123 456',
      ];
      for (const phone of phones) {
        const user = { ...generateValidUser(), phone };
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(0);
      }
    });

    test('validation should be incorrect when PHONE is invalid', () => {
      const phones: Array<string | null | undefined> = [
        null,
        undefined,
        '',
        '  ',
        'invalid phone',
        'phone',
        '1',
        '12',
        '123',
        '1234',
        '12345',
        '123456',
        '+22 1',
        '+48 22 1',
        '1234567890123456',
        '012345678',
        '+48012345678',
        '+48 012345678',
        '+48 012 345 678',
      ];
      for (const phone of phones) {
        const user = { ...generateValidUser(), phone };
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(1);
        expect(validationResult[0].property).toBe('phone');
      }
    });

    test('validation should be correct when PASSWORD is valid', () => {
      const passwords: string[] = [
        'PaasssworD!',
        'PaasssworD@!',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'Passwordd',
        'Passwordd1',
        'Passwordd!',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'PaasssworD123@$',
        'PaasssworD123@$',
      ];
      for (const password of passwords) {
        const user = { ...generateValidUser(), password };
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(0);
      }
    });

    test('validation should be incorrect when PASSWORD is invalid', () => {
      const passwords: Array<string | null | undefined> = [null, undefined, '', 'paasssword', 'P@sswo2!', 'more_than_50_chars_password!10P@sswo2!10P@sswo2!101'];
      for (const password of passwords) {
        const user = { ...generateValidUser(), password };
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(1);
        expect(validationResult[0].property).toBe('password');
      }
    });
  });
});
