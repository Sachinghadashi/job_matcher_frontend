import React, { useState, useEffect } from 'react';
import { jobAPI, authAPI } from '../services/api';
import Swal from 'sweetalert2';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import LoadingSpinner from '../components/LoadingSpinner';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Data States
    const [analytics, setAnalytics] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [users, setUsers] = useState([]);

    // Modal States
    const [showJobModal, setShowJobModal] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [jobForm, setJobForm] = useState({
        title: '', company: '', category: '', location: '', salary: '', skills_required: '', description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, jobsRes, usersRes] = await Promise.all([
                jobAPI.getAnalytics(),
                jobAPI.getAllJobs(),
                authAPI.getUsers()
            ]);
            setAnalytics(analyticsRes.data);
            setJobs(jobsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error("Error fetching admin data", error);
        }
        setLoading(false);
    };

    const openJobModal = (job = null) => {
        if (job) {
            setEditingJob(job);
            setJobForm({ ...job, skills_required: job.skills_required.join(', ') });
        } else {
            setEditingJob(null);
            setJobForm({ title: '', company: '', category: '', location: '', salary: '', skills_required: '', description: '' });
        }
        setShowJobModal(true);
    };

    const handleJobSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...jobForm,
            skills_required: jobForm.skills_required.split(',').map(s => s.trim()).filter(s => s)
        };

        if (!editingJob) {
            payload.job_id = "J" + Math.floor(Math.random() * 1000000);
        }

        try {
            if (editingJob) {
                await jobAPI.updateJob(editingJob._id, payload);
            } else {
                await jobAPI.createJob(payload);
            }
            setShowJobModal(false);
            Swal.fire({
                title: 'Success!',
                text: editingJob ? 'Job updated successfully.' : 'Job published successfully.',
                icon: 'success',
                confirmButtonColor: '#4361ee',
                borderRadius: '15px'
            });
            fetchData();
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Error!',
                text: 'There was a problem saving the job.',
                icon: 'error',
                confirmButtonColor: '#4361ee'
            });
        }
    };

    const handleDeleteJob = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You are about to permanently delete this job posting.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#4361ee',
            confirmButtonText: 'Yes, delete it!',
            borderRadius: '15px'
        });

        if (result.isConfirmed) {
            try {
                await jobAPI.deleteJob(id);
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The job has been removed.',
                    icon: 'success',
                    confirmButtonColor: '#4361ee'
                });
                fetchData();
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to delete the job.',
                    icon: 'error',
                    confirmButtonColor: '#4361ee'
                });
            }
        }
    };



    const chartData = {
        labels: analytics?.topSkills?.map(s => s.skill) || [],
        datasets: [{
            label: 'Most In-Demand Skills',
            data: analytics?.topSkills?.map(s => s.count) || [],
            backgroundColor: 'rgba(67, 97, 238, 0.7)',
            borderColor: 'rgba(67, 97, 238, 1)',
            borderWidth: 1,
            borderRadius: 6
        }]
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container py-4 mt-2">
            <h2 className="mb-4 fw-bold text-dark"><i className="bi bi-shield-lock me-2 text-primary"></i>Command Center</h2>

            {/* Navigation Tabs */}
            <ul className="nav nav-pills mb-4 pb-2 border-bottom">
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 me-2 fw-medium ${activeTab === 'overview' ? 'active shadow-sm' : 'text-secondary bg-light'}`} onClick={() => setActiveTab('overview')}>
                        <i className="bi bi-house-door me-2"></i>Overview
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 me-2 fw-medium ${activeTab === 'users' ? 'active shadow-sm' : 'text-secondary bg-light'}`} onClick={() => setActiveTab('users')}>
                        <i className="bi bi-people me-2"></i>View Users
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 fw-medium ${activeTab === 'jobs' ? 'active shadow-sm' : 'text-secondary bg-light'}`} onClick={() => setActiveTab('jobs')}>
                        <i className="bi bi-briefcase me-2"></i>Manage Jobs
                    </button>
                </li>
            </ul>

            {/* Tab Content: OVERVIEW */}
            {activeTab === 'overview' && (
                <>
                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <div className="card stat-card text-white bg-gradient-primary h-100 border-0 rounded-4 shadow-sm p-2">
                                <div className="card-body d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="card-title text-white-50 fw-semibold text-uppercase tracking-wider mb-1">Total Users</h6>
                                        <h2 className="display-4 fw-bold mb-0">{analytics?.totalUsers}</h2>
                                    </div>
                                    <i className="bi bi-people-fill display-3 text-white opacity-50"></i>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card stat-card text-white bg-gradient-success h-100 border-0 rounded-4 shadow-sm p-2">
                                <div className="card-body d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="card-title text-white-50 fw-semibold text-uppercase tracking-wider mb-1">Total Jobs</h6>
                                        <h2 className="display-4 fw-bold mb-0">{analytics?.totalJobs}</h2>
                                    </div>
                                    <i className="bi bi-briefcase-fill display-3 text-white opacity-50"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4 border-0 shadow-sm rounded-4">
                        <div className="d-flex align-items-center mb-4">
                            <i className="bi bi-bar-chart-fill text-primary fs-3 me-2"></i>
                            <h4 className="mb-0 fw-bold">Analytics: Top Technical Priorities</h4>
                        </div>
                        <div className="chart-container" style={{ position: 'relative', height: '350px' }}>
                            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true }, x: { grid: { display: false } } } }} />
                        </div>
                    </div>
                </>
            )}

            {/* Tab Content: USERS */}
            {activeTab === 'users' && (
                <div className="card border-0 shadow-sm rounded-4 p-4">
                    <h4 className="fw-bold mb-4"><i className="bi bi-person-lines-fill text-primary me-2"></i>Registered User Database</h4>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-uppercase small text-muted">
                                <tr>
                                    <th className="rounded-start-2 py-3 px-3">Name</th>
                                    <th className="py-3">Email Account</th>
                                    <th className="py-3">Extracted Skills</th>
                                    <th className="py-3">Role Status</th>
                                    <th className="rounded-end-2 py-3">Registration Date</th>
                                </tr>
                            </thead>
                            <tbody className="border-top-0">
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td className="px-3 fw-bold text-dark">{u.name}</td>
                                        <td className="text-secondary">{u.email}</td>
                                        <td>
                                            {u.skills?.length > 0 ? (
                                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1">
                                                    {u.skills.length} core skills
                                                </span>
                                            ) : (
                                                <span className="text-muted small border px-2 py-1 rounded">No resume</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${u.role === 'admin' ? 'bg-danger shadow-sm' : 'bg-secondary bg-opacity-25 text-dark'} px-2 py-1`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="text-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <div className="text-center p-5 text-muted"><i className="bi bi-inbox fs-1 d-block mb-3"></i>No users found.</div>}
                    </div>
                </div>
            )}

            {/* Tab Content: JOBS */}
            {activeTab === 'jobs' && (
                <div className="card border-0 shadow-sm rounded-4 p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold mb-0"><i className="bi bi-briefcase-fill text-primary me-2"></i>Job Postings</h4>
                        <div className="d-flex gap-2">
                            <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={() => openJobModal()}><i className="bi bi-plus-lg me-2"></i>Post New Job</button>
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-uppercase small text-muted">
                                <tr>
                                    <th className="rounded-start-2 py-3 px-3 w-25">Title / Organization</th>
                                    <th className="py-3 w-15">Category</th>
                                    <th className="py-3 w-20">Compensation</th>
                                    <th className="py-3 w-20">City</th>
                                    <th className="rounded-end-2 py-3 text-end px-3">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="border-top-0">
                                {jobs.map(job => (
                                    <tr key={job._id}>
                                        <td className="px-3">
                                            <p className="fw-bold text-dark mb-0">{job.title}</p>
                                            <small className="text-secondary"><i className="bi bi-building me-1"></i>{job.company}</small>
                                        </td>
                                        <td><span className="badge bg-light text-primary border rounded-pill px-3 py-1">{job.category}</span></td>
                                        <td className="fw-semibold text-success">{job.salary}</td>
                                        <td className="text-secondary"><i className="bi bi-geo-alt me-1"></i>{job.location}</td>
                                        <td className="text-end px-3">
                                            <button className="btn btn-sm btn-light border text-primary rounded-pill px-3 me-2" onClick={() => openJobModal(job)}><i className="bi bi-pencil-square me-1"></i>Edit</button>
                                            <button className="btn btn-sm btn-light border text-danger rounded-pill px-3" onClick={() => handleDeleteJob(job._id)}><i className="bi bi-trash3-fill"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {jobs.length === 0 && <div className="text-center p-5 text-muted"><i className="bi bi-inbox fs-1 d-block mb-3"></i>No jobs currently listed.</div>}
                    </div>
                </div>
            )}

            {/* Job Modal Editor Overlay */}
            {showJobModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}></div>
                    <div className="modal fade show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                                <form onSubmit={handleJobSubmit}>
                                    <div className="modal-header border-0 bg-primary bg-opacity-10 p-4">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-white rounded-circle p-2 shadow-sm me-3">
                                                <i className="bi bi-pencil-square fs-4 text-primary px-1"></i>
                                            </div>
                                            <h4 className="modal-title fw-bold text-dark">{editingJob ? 'Edit Job Posting' : 'Author New Job'}</h4>
                                        </div>
                                        <button type="button" className="btn-close shadow-none" onClick={() => setShowJobModal(false)}></button>
                                    </div>
                                    <div className="modal-body p-4 p-md-5 bg-white">
                                        <div className="row g-4">
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-bold text-uppercase tracking-wider">Position Title *</label>
                                                <input type="text" className="form-control" required value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-bold text-uppercase tracking-wider">Organization *</label>
                                                <input type="text" className="form-control" required value={jobForm.company} onChange={e => setJobForm({ ...jobForm, company: e.target.value })} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-bold text-uppercase tracking-wider">Classification *</label>
                                                <input type="text" className="form-control" placeholder="e.g. Data Science" required value={jobForm.category} onChange={e => setJobForm({ ...jobForm, category: e.target.value })} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-bold text-uppercase tracking-wider">Geography *</label>
                                                <input type="text" className="form-control" placeholder="Remote, Region, etc." required value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label text-secondary small fw-bold text-uppercase tracking-wider">Compensation Structure *</label>
                                                <input type="text" className="form-control" placeholder="e.g. $100,000 - $140,000" required value={jobForm.salary} onChange={e => setJobForm({ ...jobForm, salary: e.target.value })} />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label text-secondary small fw-bold text-uppercase tracking-wider">Extracted Match Keywords (Comma Separated) *</label>
                                                <input type="text" className="form-control border-primary border-opacity-50" placeholder="react, nodejs, amazon web services, kubernetes" required value={jobForm.skills_required} onChange={e => setJobForm({ ...jobForm, skills_required: e.target.value })} />
                                                <small className="text-muted mt-1 d-block"><i className="bi bi-info-circle me-1"></i>These exact terms trigger the candidate recommendation AI.</small>
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label text-secondary small fw-bold text-uppercase tracking-wider">Job Description Details</label>
                                                <textarea className="form-control" rows="4" value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })}></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0 p-4 bg-light d-flex justify-content-between">
                                        <button type="button" className="btn btn-outline-secondary rounded-pill px-5 fw-medium" onClick={() => setShowJobModal(false)}>Discard</button>
                                        <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm"><i className="bi bi-cloud-arrow-up-fill me-2"></i>{editingJob ? 'Save Modifications' : 'Publish Job'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
