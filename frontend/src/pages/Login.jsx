import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalError('');
        setFieldErrors({});

        // Custom frontend validation
        const errors = {};
        if (!email) errors.email = "Email address is required.";
        else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Please provide a valid email format.";
        if (!password) errors.password = "Password is required.";

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.login({ email, password });
            login(res.data.user);
            if (res.data.user.role === 'admin') navigate('/admin');
            else navigate('/user');
        } catch (err) {
            if (err.response?.data?.errors) {
                setFieldErrors(err.response.data.errors);
            } else {
                setGlobalError(err.response?.data?.message || 'Login failed. Please try again.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="container-fluid px-0 flex-grow-1 d-flex flex-column">
            <div className="row g-0 flex-grow-1 align-items-stretch">
                {/* Left side - Branding */}
                <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center text-white bg-gradient-primary p-5">
                    <i className="bi bi-robot" style={{ fontSize: '12rem', opacity: 0.9 }}></i>
                    <h1 className="fw-bold display-5 mt-4 text-center">Your Next Career Move.</h1>
                    <p className="lead text-center opacity-75 mt-3" style={{ maxWidth: '500px' }}>
                        Let our advanced AI analyze your skills and find the perfect role tailored specifically for you.
                    </p>
                </div>

                {/* Right side - Login Form */}
                <div className="col-lg-6 d-flex justify-content-center align-items-center py-4 py-lg-5 px-3 px-md-4">
                    <div className="card p-4 p-md-5 border-0 shadow-lg w-100" style={{ maxWidth: '450px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '24px' }}>
                        <div className="text-center mb-4 pb-2">
                            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                                <i className="bi bi-box-arrow-in-right" style={{ fontSize: '2.5rem' }}></i>
                            </div>
                            <h2 className="fw-bold text-dark mb-1">Welcome Back</h2>
                            <p className="text-muted mb-0">Sign in to access your jobs</p>
                        </div>

                        {globalError && <div className="alert alert-danger px-3 py-2"><i className="bi bi-exclamation-triangle-fill me-2"></i>{globalError}</div>}

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-4">
                                <label className="fw-medium mb-1 ms-1 text-muted"><i className="bi bi-envelope me-2"></i>Email Address</label>
                                <input 
                                    type="email" 
                                    className={`form-control form-control-lg fs-6 py-3 ${fieldErrors.email ? 'is-invalid' : ''}`} 
                                    placeholder="Enter Email Address" 
                                    value={email} 
                                    onChange={e => {
                                        setEmail(e.target.value);
                                        if (fieldErrors.email) setFieldErrors(prev => ({...prev, email: ''}));
                                    }} 
                                />
                                {fieldErrors.email && <div className="invalid-feedback fw-medium mt-1 ms-2">{fieldErrors.email}</div>}
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-1 ms-1">
                                    <label className="fw-medium text-muted"><i className="bi bi-lock me-2"></i>Password</label>
                                    <a href="#" className="text-primary text-decoration-none small fw-semibold">Forgot Password?</a>
                                </div>
                                <input 
                                    type="password" 
                                    className={`form-control form-control-lg fs-6 py-3 ${fieldErrors.password ? 'is-invalid' : ''}`} 
                                    placeholder="Enter Password" 
                                    value={password} 
                                    onChange={e => {
                                        setPassword(e.target.value);
                                        if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: ''}));
                                    }} 
                                />
                                {fieldErrors.password && <div className="invalid-feedback fw-medium mt-1 ms-2">{fieldErrors.password}</div>}
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg w-100 py-3 mb-4 rounded-3 shadow-sm fw-bold tracking-wide" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-shield-lock-fill me-2"></i>}
                                {loading ? 'Authenticating...' : 'Sign In To Your Account'}
                            </button>
                        </form>
                        <p className="text-center mb-0 text-muted">
                            New to AI Job Matcher? <Link to="/register" className="text-primary fw-bold text-decoration-none ms-1">Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
