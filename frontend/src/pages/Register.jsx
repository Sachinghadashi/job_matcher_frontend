import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            setFieldErrors(prev => ({...prev, [e.target.name]: ''}));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalError('');
        setFieldErrors({});

        // Custom frontend validation
        const errors = {};
        if (!formData.name || formData.name.trim().length < 2) errors.name = "Full name must be at least 2 characters.";
        if (!formData.email) errors.email = "Email address is required.";
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = "Please provide a valid email format.";
        if (!formData.password || formData.password.length < 6) errors.password = "Password must be at least 6 characters.";

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.register(formData);
            login(res.data.user);
            if (res.data.user.role === 'admin') navigate('/admin');
            else navigate('/user');
        } catch (err) {
            if (err.response?.data?.errors) {
                setFieldErrors(err.response.data.errors);
            } else {
                setGlobalError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="container-fluid px-0 flex-grow-1 d-flex flex-column">
            <div className="row g-0 flex-grow-1 align-items-stretch">
                {/* Left side - Branding */}
                <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center text-white bg-gradient-success p-5">
                    <i className="bi bi-rocket-takeoff" style={{ fontSize: '12rem', opacity: 0.9 }}></i>
                    <h1 className="fw-bold display-5 mt-4 text-center">Accelerate Your Future.</h1>
                    <p className="lead text-center opacity-75 mt-3" style={{ maxWidth: '500px' }}>
                        Join thousands of professionals finding exactly the right opportunities faster using our AI ecosystem.
                    </p>
                </div>

                {/* Right side - Register Form */}
                <div className="col-lg-6 d-flex justify-content-center align-items-center py-4 py-lg-5 px-3 px-md-4">
                    <div className="card p-4 p-md-5 border-0 shadow-lg w-100" style={{ maxWidth: '450px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '24px' }}>
                        <div className="text-center mb-4 pb-2">
                            <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                                <i className="bi bi-person-lines-fill" style={{ fontSize: '2.5rem' }}></i>
                            </div>
                            <h2 className="fw-bold text-dark mb-1">Create Account</h2>
                            <p className="text-muted mb-0">Join the smart job matching platform</p>
                        </div>

                        {globalError && <div className="alert alert-danger px-3 py-2"><i className="bi bi-exclamation-triangle-fill me-2"></i>{globalError}</div>}

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-3">
                                <label className="fw-medium mb-1 ms-1 text-muted"><i className="bi bi-person me-2"></i>Full Name</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    className={`form-control fs-6 py-2 ${fieldErrors.name ? 'is-invalid' : ''}`} 
                                    placeholder="Enter your Name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                />
                                {fieldErrors.name && <div className="invalid-feedback fw-medium ms-2">{fieldErrors.name}</div>}
                            </div>
                            <div className="mb-3">
                                <label className="fw-medium mb-1 ms-1 text-muted"><i className="bi bi-envelope me-2"></i>Email Address</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    className={`form-control fs-6 py-2 ${fieldErrors.email ? 'is-invalid' : ''}`} 
                                    placeholder="Enter your Email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                />
                                {fieldErrors.email && <div className="invalid-feedback fw-medium ms-2">{fieldErrors.email}</div>}
                            </div>
                            <div className="mb-4">
                                <label className="fw-medium mb-1 ms-1 text-muted"><i className="bi bi-lock me-2"></i>Password</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    className={`form-control fs-6 py-2 ${fieldErrors.password ? 'is-invalid' : ''}`} 
                                    placeholder="Enter your Password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                />
                                {fieldErrors.password && <div className="invalid-feedback fw-medium ms-2">{fieldErrors.password}</div>}
                            </div>

                            <button type="submit" className="btn btn-success btn-lg w-100 py-3 mt-2 mb-4 rounded-3 shadow-sm fw-bold tracking-wide" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-person-plus-fill me-2"></i>}
                                {loading ? 'Registering...' : 'Create My Account'}
                            </button>
                        </form>
                        <p className="text-center mb-0 text-muted">
                            Already have an account? <Link to="/login" className="text-success fw-bold text-decoration-none ms-1">Sign in instead</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
