'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/amplitude/client';
import { PageTracking } from '@/app/components/PageTracking';
import { GoogleCaptchaWrapper } from '@/app/components/GoogleCaptchaWrapper';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const ContactForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const { executeRecaptcha } = useGoogleReCaptcha();

  // Check if user is authenticated and pre-fill email if available
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setIsAuthenticated(true);
          setUserEmail(user.email || null);
          if (user.email) {
            setEmail(user.email);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
  }, []);

  const validateField = (fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'firstName':
        if (!value.trim()) {
          return 'First name is required';
        }
        return null;

      case 'lastName':
        if (!value.trim()) {
          return 'Last name is required';
        }
        return null;

      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return 'Invalid email format';
        }
        return null;

      case 'message':
        if (!value.trim()) {
          return 'Message is required';
        }
        if (value.trim().length < 10) {
          return 'Message must be at least 10 characters long';
        }
        return null;

      default:
        return null;
    }
  };

  const handleBlur = (fieldName: string, value: string) => {
    const error = validateField(fieldName, value);
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    const firstNameError = validateField('firstName', firstName);
    const lastNameError = validateField('lastName', lastName);
    const emailError = validateField('email', email);
    const messageError = validateField('message', message);

    if (firstNameError) newErrors.firstName = firstNameError;
    if (lastNameError) newErrors.lastName = lastNameError;
    if (emailError) newErrors.email = emailError;
    if (messageError) newErrors.message = messageError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Track validation error
      trackEvent('User Failed Contact Form Submission', {
        'Page Route': '/contact',
        'Error Type': 'Validation Error',
        'Errors': Object.keys(newErrors).join(', '),
        'Is Authenticated': isAuthenticated,
      });

      return;
    }

    setIsSubmitting(true);

    try {
      // Execute reCAPTCHA and get token
      let recaptchaToken: string | null = null;
      if (executeRecaptcha) {
        recaptchaToken = await executeRecaptcha('contact_submit');
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          message: message.trim(),
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit contact form');
      }

      // Track successful submission
      trackEvent('User Submitted Contact Form', {
        'Page Route': '/contact',
        'Is Authenticated': isAuthenticated,
        'Message Length': message.trim().length,
      });

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail(userEmail || '');
      setMessage('');
      setErrors({});
      setSubmitSuccess(true);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit contact form');

      // Track submission error
      trackEvent('User Failed Contact Form Submission', {
        'Page Route': '/contact',
        'Error Type': 'Submission Error',
        'Error Message': error instanceof Error ? error.message : 'Unknown error',
        'Is Authenticated': isAuthenticated,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [firstName, lastName, email, message, isAuthenticated, userEmail, executeRecaptcha]);

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_10px_0_0_rgba(0,0,0,0.1)] sm:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200 p-6 sm:p-8 md:p-10">
      {submitSuccess && (
        <div className="mb-6 p-4 rounded-[1.5rem] bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300 shadow-md">
          <p className="text-green-800 font-bold text-center">
            Thank you for contacting us! We will get back to you soon.
          </p>
        </div>
      )}

      {submitError && (
        <div className="mb-6 p-4 rounded-[1.5rem] bg-gradient-to-br from-red-100 to-orange-100 border-2 border-red-300 shadow-md">
          <p className="text-red-800 font-bold text-center">
            {submitError}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={(e) => handleBlur('firstName', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="mt-1 text-sm text-red-600 font-semibold">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={(e) => handleBlur('lastName', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="mt-1 text-sm text-red-600 font-semibold">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-bold text-gray-700 mb-2"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => handleBlur('email', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600 font-semibold">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-bold text-gray-700 mb-2"
          >
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={(e) => handleBlur('message', e.target.value)}
            rows={6}
            className={`w-full px-4 py-3 border-2 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-y font-medium transition-all ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          {errors.message && (
            <p id="message-error" className="mt-1 text-sm text-red-600 font-semibold">
              {errors.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Minimum 10 characters
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-br from-purple-600 to-pink-600 text-white py-4 px-6 rounded-[1.5rem] font-black text-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_6px_0_0_rgba(147,51,234,0.5)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.5)]"
          >
            {isSubmitting ? 'Submitting...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ContactPage = () => {
  return (
    <>
      <PageTracking pageName="Contact" />
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 md:mb-12">
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_15px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 mb-6">
              <span className="text-5xl mb-4 block">📧</span>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-3">
                Contact Us
              </h1>
              <p className="text-xl text-gray-700 font-semibold">
                Have a question or feedback? We&apos;d love to hear from you!
              </p>
            </div>
          </div>

          {/* Form Card wrapped with reCAPTCHA provider */}
          <GoogleCaptchaWrapper>
            <ContactForm />
          </GoogleCaptchaWrapper>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
