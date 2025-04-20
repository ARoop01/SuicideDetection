document.addEventListener('DOMContentLoaded', function() {
    // Common elements
    const alertModal = new bootstrap.Modal(document.getElementById('alert-modal'));
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    
    // Password toggle functionality
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            // Toggle input type
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Show alert function
    function showAlert(title, message, isSuccess = true) {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        alertTitle.className = isSuccess ? 'text-success' : 'text-danger';
        alertModal.show();
    }
    
    // Handle register form if it exists on the page
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation
            if (!this.checkValidity()) {
                e.stopPropagation();
                this.classList.add('was-validated');
                return;
            }
            
            // Check if passwords match
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            if (password !== confirmPassword) {
                document.getElementById('register-confirm-password').setCustomValidity('Passwords do not match');
                this.classList.add('was-validated');
                return;
            } else {
                document.getElementById('register-confirm-password').setCustomValidity('');
            }
            
            // Get form data
            const userData = {
                email: document.getElementById('register-email').value,
                mobile: document.getElementById('register-mobile').value,
                password: password,
                dob: document.getElementById('register-dob').value
            };
            
            // Send data to server
            fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Success', 'Registration successful! You can now log in.');
                    // Clear form
                    registerForm.reset();
                    // Redirect to login after 2 seconds
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    showAlert('Error', data.message || 'Registration failed.', false);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error', 'An unexpected error occurred. Please try again.', false);
            });
        });
    }
    
    // Handle login form if it exists on the page
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation
            if (!this.checkValidity()) {
                e.stopPropagation();
                this.classList.add('was-validated');
                return;
            }
            
            // Get form data
            const loginData = {
                identifier: document.getElementById('login-identifier').value,
                password: document.getElementById('login-password').value
            };
            
            // Send data to server
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Success', 'Login successful! Redirecting to chat...');
                    // Redirect to home/chat page after 1 second
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    showAlert('Error', data.message || 'Login failed. Please check your credentials.', false);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error', 'An unexpected error occurred. Please try again.', false);
            });
        });
    }
    
    // Handle forgot password link
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('login-form-container').classList.add('d-none');
            document.getElementById('forgot-password-container').classList.remove('d-none');
        });
    }
    
    // Handle back to login from forgot password
    const backToLoginFromReset = document.getElementById('back-to-login-from-reset');
    if (backToLoginFromReset) {
        backToLoginFromReset.addEventListener('click', function() {
            document.getElementById('forgot-password-container').classList.add('d-none');
            document.getElementById('login-form-container').classList.remove('d-none');
        });
    }
    
    // Handle back to login from DOB verification
    const backToLogin = document.getElementById('back-to-login');
    if (backToLogin) {
        backToLogin.addEventListener('click', function() {
            document.getElementById('dob-verification-container').classList.add('d-none');
            document.getElementById('login-form-container').classList.remove('d-none');
        });
    }
    
    // Handle forgot password form
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation
            if (!this.checkValidity()) {
                e.stopPropagation();
                this.classList.add('was-validated');
                return;
            }
            
            // For demo purposes, just show success message
            showAlert('Password Reset', 'If your email is registered with us, you will receive a password reset link shortly.');
            
            // Show DOB verification form instead of login form
            document.getElementById('forgot-password-container').classList.add('d-none');
            document.getElementById('dob-verification-container').classList.remove('d-none');
        });
    }
    
    // Handle DOB verification form
    const dobVerificationForm = document.getElementById('dob-verification-form');
    if (dobVerificationForm) {
        dobVerificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation
            if (!this.checkValidity()) {
                e.stopPropagation();
                this.classList.add('was-validated');
                return;
            }
            
            // For demo purposes, just show success message
            showAlert('Success', 'Identity verified! You can now reset your password.');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                document.getElementById('dob-verification-container').classList.add('d-none');
                document.getElementById('login-form-container').classList.remove('d-none');
            }, 2000);
        });
    }
});