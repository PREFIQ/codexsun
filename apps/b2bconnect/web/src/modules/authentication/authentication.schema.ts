import type { B2bConnectLoginErrors, B2bConnectLoginValues } from "./authentication.types";

export function validateB2bConnectLogin(values: B2bConnectLoginValues) {
  const errors: B2bConnectLoginErrors = {};
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/u.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.password) {
    errors.password = "Password is required.";
  }
  return errors;
}
