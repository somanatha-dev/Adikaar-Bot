import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { http } from '../lib/http.js';


const Login = () => {
    const [ form, setForm ] = useState({ email: '', password: '' });
    const [ submitting, setSubmitting ] = useState(false);
    const [ error, setError ] = useState('');
    const navigate = useNavigate();
    

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
    setSubmitting(true);
    setError('');


        console.log(form);

        http.post("/api/auth/login", {
            email: form.email,
            password: form.password
        }).then((res) => {
            console.log(res);
            navigate("/"); // home page
        }).catch((err) => {
            console.error(err);
            const msg = err?.response?.data?.message || 'Wrong email or password';
            setError(msg);
        }).finally(() => {
            setSubmitting(false);
        });

    }

    return (
        <div className="center-min-h-screen">
            <div className="auth-card" role="main" aria-labelledby="login-heading">
                <header className="auth-header">
                    <h1 id="login-heading">Sign in</h1>
                    <p className="auth-sub">Welcome back. We've missed you.</p>
                </header>
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="field-group">
                        <label htmlFor="login-email">Email</label>
                        <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@example.com"  onChange={handleChange} required />
                    </div>
                    <div className="field-group">
                        <label htmlFor="login-password">Password</label>
                        <input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Your password"  onChange={handleChange} required />
                    </div>
                    {error && <div style={{ color:'#ff6b6b', fontSize:'0.9rem', marginTop: 4 }}>{error}</div>}
                    <button type="submit" className="primary-btn" disabled={submitting}>
                        {submitting ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                <p className="auth-alt">Need an account? <Link to="/register">Create one</Link></p>
            </div>
        </div>
    );
};

export default Login;

