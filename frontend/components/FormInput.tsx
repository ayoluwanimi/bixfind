'use client';

import { FieldError } from 'react-hook-form';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FieldError;
  helpText?: string;
}

export function FormInput({ label, error, helpText, ...props }: FormInputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      {helpText && !error && <p className="text-gray-500 text-sm mt-1">{helpText}</p>}
    </div>
  );
}
