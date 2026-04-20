import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, jobAPI } from '../services/api';
import Swal from 'sweetalert2';
import LoadingSpinner from '../components/LoadingSpinner';

const UserDashboard = () => {
    const { user, updateAuthUser } = useAuth();
    const [skillsInput, setSkillsInput] = useState(user?.skills?.join(', ') || '');
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(() => {
        if (user?.skills?.length > 0) {
            fetchRecommendations();
        }
    }, [user]);

    const fetchRecommendations = async () => {
        setLoadingRecs(true);
        try {
            const res = await jobAPI.getRecommendations();
            setRecommendations(res.data);
        } catch (error) {
            console.error("Failed to fetch recommendations", error);
        }
        setLoadingRecs(false);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(s => s !== '');
        try {
            const res = await authAPI.updateProfile({ skills: skillsArray });
            updateAuthUser(res.data);
            Swal.fire({
                title: 'Success!',
                text: 'Profile updated successfully!',
                icon: 'success',
                confirmButtonColor: '#4361ee'
            });
            fetchRecommendations();
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Update Failed',
                text: 'Could not save profile changes.',
                icon: 'error',
                confirmButtonColor: '#4361ee'
            });
        }
        setIsUpdating(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('resume', file);

        setUploadingResume(true);
        try {
            const res = await authAPI.uploadResume(formData);
            const extractedSkills = res.data.skills;
            
            if (extractedSkills.length > 0) {
                const currentSkills = skillsInput.split(',').map(s => s.trim()).filter(s => s !== '');
                const combinedSkills = [...new Set([...currentSkills, ...extractedSkills])];
                setSkillsInput(combinedSkills.join(', '));
                Swal.fire({
                    title: 'Resume Parsed!',
                    text: `Successfully extracted ${extractedSkills.length} skills! Please review and click 'Save & Match Jobs'.`,
                    icon: 'success',
                    confirmButtonColor: '#4361ee'
                });
            } else {
                Swal.fire({
                    title: 'No Skills Found',
                    text: 'No recognizable tech skills were extracted automatically. Please enter them manually.',
                    icon: 'info',
                    confirmButtonColor: '#4361ee'
                });
            }
        } catch (err) {
            console.error("Resume parsing error:", err);
            Swal.fire({
                title: 'Parsing Error',
                text: err.response?.data?.message || "Failed to parse resume.",
                icon: 'error',
                confirmButtonColor: '#4361ee'
            });
        }
        setUploadingResume(false);
        e.target.value = null; // reset file input
    };

    return (
        <div className="container py-4 mt-2">
            <h2 className="mb-4 fw-bold text-dark"><i className="bi bi-speedometer2 me-2 text-primary"></i>Candidate Dashboard</h2>
            <div className="row g-4">
                <div className="col-md-4">
                    <div className="card p-4 h-100">
                        <div className="d-flex align-items-center mb-4">
                            <i className="bi bi-person-badge fs-2 text-primary me-3"></i>
                            <h4 className="mb-0 fw-bold">My Profile</h4>
                        </div>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="mb-4">
                                <label className="fw-medium text-muted mb-2"><i className="bi bi-code-slash me-2"></i>My Skills (comma separated)</label>
                                <textarea
                                    className="form-control mb-3"
                                    rows="4"
                                    value={skillsInput}
                                    onChange={e => setSkillsInput(e.target.value)}
                                    placeholder="e.g. react, nodejs, python"
                                />
                                
                                <label className="fw-medium text-muted mb-2"><i className="bi bi-file-earmark-pdf me-2"></i>Upload Resume (.pdf, .docx)</label>
                                <div className="border border-primary border-opacity-25 rounded-3 bg-primary bg-opacity-10 p-3 text-center" style={{ borderStyle: 'dashed !important' }}>
                                    <label htmlFor="resumeUpload" className="btn btn-sm btn-primary rounded-pill px-4" style={{cursor: 'pointer'}}>
                                        {uploadingResume ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-cloud-arrow-up-fill me-2"></i>}
                                        {uploadingResume ? ' Parsing File...' : 'Select File'}
                                    </label>
                                    <input 
                                        type="file" 
                                        id="resumeUpload" 
                                        className="d-none" 
                                        accept=".pdf,.docx,.doc" 
                                        onChange={handleFileUpload} 
                                        disabled={uploadingResume} 
                                    />
                                    <p className="small text-muted mt-2 mb-0">We will instantly extract your skills.</p>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-success w-100" disabled={isUpdating}>
                                {isUpdating ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-floppy me-2"></i>}
                                {isUpdating ? 'Saving...' : 'Save & Match Jobs'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="col-md-8">
                    <h4 className="mb-3 fw-bold"><i className="bi bi-stars text-warning me-2"></i>Recommended Jobs</h4>
                    {loadingRecs ? <LoadingSpinner /> : (
                        user?.skills?.length > 0 ? (
                            recommendations.length > 0 ? (
                                <div className="row g-3">
                                    {recommendations.map((job, idx) => (
                                        <div className="col-lg-6" key={job.job_id || idx}>
                                            <div className="card job-card h-100 p-4">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h5 className="fw-bold mb-0">{job.title}</h5>
                                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2">
                                                        <i className="bi bi-lightning-charge-fill text-warning me-1"></i>
                                                        {(job.similarity_score * 100).toFixed(0)}% Match
                                                    </span>
                                                </div>
                                                <h6 className="text-secondary fw-semibold mb-3"><i className="bi bi-building me-2"></i>{job.company} &bull; <i className="bi bi-geo-alt ms-1 me-1"></i>{job.location}</h6>
                                                
                                                <div className="mt-auto pt-3 border-top">
                                                    <p className="mb-2 fs-6 text-muted"><i className="bi bi-briefcase me-2"></i>{job.category}</p>
                                                    <p className="mb-2 fs-6 text-muted"><i className="bi bi-cash-stack me-2"></i><span className="fw-semibold text-success">{job.salary}</span></p>
                                                    <div className="mt-3">
                                                        {job.skills_required.split(', ').slice(0, 4).map((skill, i) => (
                                                            <span key={i} className="badge bg-light text-dark border me-1 mb-1 fw-normal px-2 py-1">{skill}</span>
                                                        ))}
                                                        {job.skills_required.split(', ').length > 4 && <span className="badge bg-light text-secondary border px-2 py-1">+{job.skills_required.split(', ').length - 4}</span>}
                                                    </div>
                                                </div>
                                                <button 
                                                    className="btn btn-outline-primary w-100 mt-3 rounded-pill fw-semibold" 
                                                    data-bs-toggle="modal" 
                                                    data-bs-target="#jobDetailsModal" 
                                                    onClick={() => setSelectedJob(job)}
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="alert alert-info border-0 shadow-sm rounded-4 p-4 d-flex align-items-center">
                                    <i className="bi bi-search fs-2 me-3 text-info"></i>
                                    <div>
                                        <h5 className="mb-1 text-dark fw-bold">No exact matches found</h5>
                                        <p className="mb-0 text-secondary">Try adding more diverse skills or checking back later for new openings.</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="alert bg-primary bg-opacity-10 border-0 shadow-sm rounded-4 p-5 text-center">
                                <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-4 shadow-sm" style={{width: '80px', height: '80px'}}>
                                    <i className="bi bi-person-workspace fs-2 text-primary"></i>
                                </div>
                                <h4 className="fw-bold text-dark">Personalize Your Job Feed</h4>
                                <p className="text-secondary mx-auto mb-0" style={{maxWidth: '400px'}}>
                                    Tell us what you're good at! Enter your skills manually or upload your resume on the left to see jobs that match your expertise.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Job Details Modal */}
            <div className="modal fade" id="jobDetailsModal" tabIndex="-1" aria-labelledby="jobDetailsModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        {selectedJob && (
                            <>
                                <div className="modal-header border-0 bg-primary bg-opacity-10 py-4 px-md-5">
                                    <div className="d-flex align-items-center w-100">
                                        <div className="bg-white rounded-circle p-3 d-flex justify-content-center align-items-center shadow-sm me-3 flex-shrink-0" style={{width: '60px', height: '60px'}}>
                                            <i className="bi bi-building fs-3 text-primary"></i>
                                        </div>
                                        <div>
                                            <h4 className="modal-title fw-bold" id="jobDetailsModalLabel">{selectedJob.title}</h4>
                                            <h6 className="text-secondary fw-medium mb-0">{selectedJob.company} &bull; <i className="bi bi-geo-alt"></i> {selectedJob.location}</h6>
                                        </div>
                                    </div>
                                    <button type="button" className="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body p-4 p-md-5">
                                    <div className="row g-4 mb-4">
                                        <div className="col-sm-6 col-md-4">
                                            <p className="text-secondary small fw-bold mb-1 text-uppercase tracking-wider">Salary</p>
                                            <p className="fw-semibold text-success fs-5 mb-0"><i className="bi bi-cash-stack me-2"></i>{selectedJob.salary}</p>
                                        </div>
                                        <div className="col-sm-6 col-md-4">
                                            <p className="text-secondary small fw-bold mb-1 text-uppercase tracking-wider">Category</p>
                                            <p className="fw-medium mb-0"><i className="bi bi-briefcase me-2 text-muted"></i>{selectedJob.category}</p>
                                        </div>
                                        <div className="col-md-4">
                                            <p className="text-secondary small fw-bold mb-1 text-uppercase tracking-wider">AI Match Score</p>
                                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 fs-6">
                                                <i className="bi bi-stars me-1 text-warning"></i>{(selectedJob.similarity_score * 100).toFixed(0)}% Match
                                            </span>
                                        </div>
                                    </div>
                                    <hr className="opacity-10 mb-4" />
                                    <h6 className="fw-bold mb-3"><i className="bi bi-lightning-charge me-2 text-warning"></i>Required Skills</h6>
                                    <div className="d-flex flex-wrap gap-2 mb-4">
                                        {selectedJob.skills_required.split(', ').map((skill, i) => (
                                            <span key={i} className="badge bg-light text-dark border px-3 py-2 fw-medium rounded-3">{skill}</span>
                                        ))}
                                    </div>
                                    {selectedJob.description && (
                                        <>
                                            <h6 className="fw-bold mb-3 pt-2"><i className="bi bi-card-text me-2 text-primary"></i>Job Description</h6>
                                            <p className="text-secondary lh-lg" style={{whiteSpace: 'pre-line'}}>{selectedJob.description}</p>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
