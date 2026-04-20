import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const NavbarComponent = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Logout?',
            text: "Are you sure you want to end your session?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#4361ee',
            confirmButtonText: 'Yes, logout',
            borderRadius: '15px'
        });

        if (result.isConfirmed) {
            await logout();
            navigate('/login');
        }
    };

    return (
        <nav className="navbar navbar-expand-lg sticky-top">
            <div className="container">
                <Link className="navbar-brand d-flex align-items-center gap-2 text-wrap" style={{ maxWidth: '85%' }} to="/">
                    <i className="bi bi-layers-half text-primary fs-3 flex-shrink-0"></i>
                    <span className="fw-bold" style={{ fontSize: '1rem', lineHeight: '1.2' }}>AI-Based Smart Job Matching &amp; Analytics Platform</span>
                </Link>
                <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <i className="bi bi-list fs-2 text-dark"></i>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto align-items-center">
                        {user && (
                            <>
                                <li className="nav-item me-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-person-circle text-primary fs-4"></i>
                                        <div className="d-flex flex-column">
                                            <span className="text-dark fw-bold lh-1">{user.name}</span>
                                            <span className="text-muted small lh-1 text-capitalize mt-1" style={{ fontSize: '0.75rem' }}>{user.role}</span>
                                        </div>
                                    </div>
                                </li>
                                <li className="nav-item">
                                    <button onClick={handleLogout} className="btn btn-outline-danger rounded-pill px-4">
                                        <i className="bi bi-box-arrow-left me-1"></i> Logout
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default NavbarComponent;
