import { ValidationError } from 'yup';

interface Errors {
  [key: string]: string;
}

export default function getValidationErrors(err: ValidationError): Errors {
  const validationErrors: Errors = {};

  if (err.inner) {
    err.inner.forEach(error => {
      validationErrors[error.path] = error.message;
    });
  }

  return validationErrors;
}
