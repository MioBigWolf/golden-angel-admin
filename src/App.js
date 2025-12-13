import React, { useState, useEffect, useCallback } from 'react';
import { Users, Home, Calendar, Plus, Trash2, CheckCircle, Clock, Upload, X, Edit, Search, Grid3x3, List } from 'lucide-react';
import { supabase } from './supabaseClient';

const DEFAULT_CHECKLIST_TEMPLATES = [
  'City sidewalk', 'Driveway', 'Front steps', 'Back deck',
  'Walkway to door', 'Garage entrance', 'Porch', 'Parking area'
];

// Login Component
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Query admin_users table
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }

      // Simple password check
      if (password === 'v@t+Hw%8Kf5ds9f' && username === 'Suhaib-acc') {
        // Store login in localStorage
        localStorage.setItem('adminAuth', JSON.stringify({ username: data.username, loggedIn: true }));
        onLogin();
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '48px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center', color: '#1f2937' }}>Golden Angel</h1>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', textAlign: 'center' }}>Admin Dashboard</p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '24px', textAlign: 'center' }}>
          Contact admin for credentials
        </p>
      </div>
    </div>
  );
};

// SearchBar component - fixed version based on working SearchableDropdown pattern
const SearchBar = React.memo(({ value, onChange }) => {
  const inputRef = React.useRef(null);

  const handleChange = (e) => {
    onChange(e);
  };

  return (
    <div style={{ position: 'relative', marginBottom: '20px' }}>
      <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search..."
        value={value}
        onChange={handleChange}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        style={{ width: '100%', padding: '12px 12px 12px 45px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
      />
    </div>
  );
});

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workers, setWorkers] = useState([]);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showBulkClientModal, setShowBulkClientModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [bulkClientText, setBulkClientText] = useState('');
  
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [workerForm, setWorkerForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '' });
  const [propertyForm, setPropertyForm] = useState({
    client_id: '', property_name: '', address: '', latitude: '', longitude: '',
    highlight_photos: [], special_notes: '', checklist: []
  });
  const [jobForm, setJobForm] = useState({
    property_id: '',
    worker_id: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    assignment_type: 'one-time',
    frequency: 'daily',
    end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months from now
    is_vip: false,
    deadline_time: '09:30',
    published: true,
    estimated_duration_minutes: 60
  });
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [expandedWorkers, setExpandedWorkers] = useState({});
  const [expandedJobs, setExpandedJobs] = useState({});
  const [editingJobId, setEditingJobId] = useState(null);
  const [newWorkerId, setNewWorkerId] = useState('');
  const [deduplicateRecurring, setDeduplicateRecurring] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', '7days', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewModes, setViewModes] = useState({
    workers: 'grid',
    clients: 'grid',
    properties: 'grid',
    jobs: 'grid',
    completed: 'grid',
    pending: 'grid',
    today: 'list'
  });
  const [selectedChecklistItems, setSelectedChecklistItems] = useState([]);
  const [customChecklistItem, setCustomChecklistItem] = useState('');
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [propertyPhotoIndexes, setPropertyPhotoIndexes] = useState({});
  const [showClientReportModal, setShowClientReportModal] = useState(false);
  const [clientReportData, setClientReportData] = useState(null);
  const [checklistTemplates, setChecklistTemplates] = useState(() => {
    const saved = localStorage.getItem('checklistTemplates');
    return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST_TEMPLATES;
  });
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [newTemplate, setNewTemplate] = useState('');
  const [completionNotifications, setCompletionNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Stable onChange handler for SearchBar to prevent re-renders
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Save checklist templates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('checklistTemplates', JSON.stringify(checklistTemplates));
  }, [checklistTemplates]);

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('[data-notification-panel]')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Realtime subscription for job completions
  useEffect(() => {
    const subscription = supabase
      .channel('job_completions')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs',
        filter: 'status=eq.completed'
      }, async (payload) => {
        console.log('🔔 Job completion detected:', payload.new);

        // Reload jobs to get fresh data
        await loadJobs();

        // Check if worker completed all their jobs FOR TODAY
        const workerId = payload.new.worker_id;
        const scheduledDate = payload.new.scheduled_date;

        // Get today's date (YYYY-MM-DD format)
        const today = new Date().toISOString().split('T')[0];
        console.log('📅 Today:', today, '| Job scheduled for:', scheduledDate);

        // Only trigger notification if the completed job is scheduled for today
        if (workerId && scheduledDate === today) {
          console.log('✅ Job is for today, checking all jobs for worker:', workerId);

          // Get all jobs for this worker scheduled for today
          const { data: workerJobs, error } = await supabase
            .from('jobs')
            .select('*, profiles!jobs_worker_id_fkey(full_name)')
            .eq('worker_id', workerId)
            .eq('scheduled_date', today);

          console.log('📊 Worker jobs for today:', workerJobs?.length, '| Error:', error);

          if (!error && workerJobs && workerJobs.length > 0) {
            const completedJobs = workerJobs.filter(j => j.status === 'completed');
            const percentage = Math.round((completedJobs.length / workerJobs.length) * 100);
            console.log('📈 Progress:', completedJobs.length, '/', workerJobs.length, '=', percentage + '%');

            // If 100% of today's jobs complete, show notification
            if (percentage === 100) {
              console.log('🎉 100% COMPLETE! Showing notification...');
              const workerName = workerJobs[0].profiles?.full_name || 'Worker';
              const notification = {
                id: Date.now(),
                workerId: workerId,
                workerName: workerName,
                date: today,
                totalJobs: workerJobs.length,
                timestamp: new Date().toISOString()
              };

              setCompletionNotifications(prev => [notification, ...prev]);
              console.log('✅ Notification added to list');

              // Show browser notification if permissions granted
              if (Notification.permission === 'granted') {
                new Notification('🎉 Worker Completed All Jobs Today!', {
                  body: `${workerName} finished all ${workerJobs.length} jobs for today`,
                  icon: '/favicon.ico'
                });
                console.log('🔔 Browser notification sent');
              } else {
                console.log('⚠️ Browser notification permission:', Notification.permission);
              }
            }
          }
        } else {
          console.log('⏭️ Skipping - job not for today or missing data');
        }
      })
      .subscribe();

    // Request notification permissions
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadWorkers(), loadClients(), loadProperties(), loadJobs(), loadIssues()]);
    setLoading(false);
  };

  const loadWorkers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'worker').order('created_at', { ascending: false });
    if (!error) {
      // Map full_name to name for backward compatibility
      const mappedData = (data || []).map(w => ({ ...w, name: w.full_name }));
      setWorkers(mappedData);
    }
  };

  const loadClients = async () => {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (!error) setClients(data || []);
  };

  const loadProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*, clients(name)').order('created_at', { ascending: false });
    if (!error) setProperties(data || []);
  };

  const loadJobs = async () => {
    const { data, error } = await supabase.from('jobs').select(`*, properties(property_name, address, clients(name)), profiles!jobs_worker_id_fkey(full_name), job_photos(photo_type, photo_url)`).order('scheduled_date', { ascending: false });
    if (!error) {
      // Map profiles.full_name to workers.name for backward compatibility
      const mappedData = (data || []).map(j => ({
        ...j,
        workers: j.profiles ? { name: j.profiles.full_name } : null,
        profiles: undefined
      }));
      setJobs(mappedData);
    }
  };

  const loadIssues = async () => {
    const { data, error } = await supabase
      .from('job_issues')
      .select(`
        *,
        jobs (
          id,
          scheduled_date,
          properties (property_name, address, clients(name)),
          profiles!jobs_worker_id_fkey(full_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      setIssues(data || []);
    }
  };

  const markIssueResolved = async (issueId) => {
    const { error } = await supabase.rpc('mark_issue_resolved', {
      issue_id: issueId
    });

    if (!error) {
      loadIssues();
      alert('Issue marked as resolved!');
    } else {
      alert('Error: ' + error.message);
    }
  };

  const addOrUpdateWorker = async () => {
    if (!workerForm.name || !workerForm.email) {
      alert('Please fill in name and email');
      return;
    }

    if (editingItem) {
      // Update existing worker using RPC function (bypasses RLS)
      const { error } = await supabase.rpc('update_worker_profile', {
        worker_id: editingItem.id,
        worker_name: workerForm.name,
        worker_email: workerForm.email,
        worker_phone: workerForm.phone || ''
      });

      if (!error) {
        alert('Worker updated successfully!');
        setEditingItem(null);
      } else {
        alert('Error updating worker: ' + error.message);
      }
    } else {
      // Create new worker - requires password
      if (!workerForm.password || workerForm.password.length < 6) {
        alert('Please provide a password (minimum 6 characters)');
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: workerForm.email.toLowerCase().trim(),
        password: workerForm.password,
        options: {
          data: {
            full_name: workerForm.name,
            phone: workerForm.phone,
            role: 'worker'
          }
        }
      });

      if (authError) {
        alert('Error creating worker account: ' + authError.message);
        return;
      }

      // Create or update profile entry using RPC function (bypasses RLS)
      const { error: profileError } = await supabase.rpc('create_worker_profile', {
        user_id: authData.user.id,
        worker_name: workerForm.name,
        worker_email: workerForm.email.toLowerCase().trim(),
        worker_phone: workerForm.phone
      });

      if (profileError) {
        alert('Error creating worker profile: ' + profileError.message);
        return;
      }

      alert(`Worker added successfully!\n\nEmail: ${workerForm.email}\nPassword: ${workerForm.password}\n\nPlease share these credentials with the worker.`);
    }

    setShowWorkerModal(false);
    setWorkerForm({ name: '', email: '', phone: '', password: '' });
    loadWorkers();
  };

  const addOrUpdateClient = async () => {
    if (!clientForm.name) {
      alert('Please fill in client name');
      return;
    }
    
    if (editingItem) {
      const { error } = await supabase.from('clients').update(clientForm).eq('id', editingItem.id);
      if (!error) {
        alert('Client updated successfully!');
        setEditingItem(null);
      } else {
        alert('Error updating client: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('clients').insert([clientForm]);
      if (!error) {
        alert('Client added successfully!');
      } else {
        alert('Error adding client: ' + error.message);
      }
    }
    
    setShowClientModal(false);
    setClientForm({ name: '', email: '', phone: '' });
    loadClients();
  };

  const bulkImportClients = async () => {
    if (!bulkClientText.trim()) {
      alert('Please enter client data');
      return;
    }

    const lines = bulkClientText.trim().split('\n').filter(line => line.trim());
    const clientsToAdd = [];
    const errors = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 1 && parts[0]) {
        clientsToAdd.push({
          name: parts[0] || '',
          email: parts[1] || '',
          phone: parts[2] || ''
        });
      } else {
        errors.push(`Line ${index + 1}: Invalid format`);
      }
    });

    if (clientsToAdd.length === 0) {
      alert('No valid clients found in the input');
      return;
    }

    if (errors.length > 0 && !window.confirm(`Found ${errors.length} invalid lines. Continue with ${clientsToAdd.length} valid clients?`)) {
      return;
    }

    const { error } = await supabase.from('clients').insert(clientsToAdd);
    if (!error) {
      alert(`Successfully added ${clientsToAdd.length} clients!`);
      setShowBulkClientModal(false);
      setBulkClientText('');
      loadClients();
    } else {
      alert('Error adding clients: ' + error.message);
    }
  };

  const generateClientReport = (job) => {
    const property = properties.find(p => p.id === job.property_id);
    const client = clients.find(c => c.id === property?.client_id);

    const report = {
      jobId: job.id,
      clientName: client?.name || 'N/A',
      clientEmail: client?.email || 'N/A',
      propertyName: property?.property_name || 'N/A',
      propertyAddress: property?.address || 'N/A',
      scheduledDate: job.scheduled_date,
      startedAt: job.started_at ? new Date(job.started_at).toLocaleString() : 'N/A',
      completedDate: job.finished_at ? new Date(job.finished_at).toLocaleString() : 'N/A',
      photos: job.job_photos || [],
      notes: job.notes || 'Service completed successfully.'
    };

    setClientReportData(report);
    setShowClientReportModal(true);
  };

  const generatePDF = async (downloadOnly = true) => {
    // Load html2pdf library dynamically
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      document.body.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const element = document.getElementById('printable-report');
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Snow_Removal_Report_${clientReportData.propertyName.replace(/\s/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 1.5,
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { mode: 'avoid-all' }
    };

    try {
      if (downloadOnly) {
        await window.html2pdf().set(opt).from(element).save();
        alert('PDF downloaded! You can now attach it to an email to send to the client.');
      } else {
        // Generate PDF as blob for email attachment
        const pdfBlob = await window.html2pdf().set(opt).from(element).outputPdf('blob');
        return pdfBlob;
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
      return null;
    }
  };

  const generateLightweightPDF = async () => {
    // Load html2pdf library dynamically
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      document.body.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const element = document.getElementById('printable-report');

    // Hide photos temporarily for lightweight version
    const photoSection = element.querySelector('div[style*="gridTemplateColumns"]')?.parentElement;
    const photosWereVisible = photoSection && photoSection.style.display !== 'none';
    if (photoSection) photoSection.style.display = 'none';

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Snow_Removal_Report_${clientReportData.propertyName.replace(/\s/g, '_')}_Lite.pdf`,
      image: { type: 'jpeg', quality: 0.3 },
      html2canvas: {
        scale: 0.5,
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { mode: 'avoid-all' }
    };

    try {
      const pdfBlob = await window.html2pdf().set(opt).from(element).outputPdf('blob');

      // Restore photos visibility
      if (photoSection && photosWereVisible) photoSection.style.display = '';

      return pdfBlob;
    } catch (error) {
      console.error('PDF generation error:', error);
      // Restore photos visibility on error
      if (photoSection && photosWereVisible) photoSection.style.display = '';
      alert('Error generating PDF. Please try again.');
      return null;
    }
  };

  const sendPDFToClient = async () => {
    // EmailJS Configuration
    const EMAILJS_SERVICE_ID = 'service_5f3oeym';
    const EMAILJS_TEMPLATE_ID = 'template_oig71cy';
    const EMAILJS_PUBLIC_KEY = 'DHwmPoO6iI2j3k2Yb';

    // Load EmailJS library
    if (!window.emailjs) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.async = true;
      document.body.appendChild(script);

      await new Promise((resolve) => {
        script.onload = () => {
          window.emailjs.init(EMAILJS_PUBLIC_KEY);
          resolve();
        };
      });
    }

    try {
      // Generate full-quality PDF with photos
      const pdfBlob = await generatePDF(false);
      if (!pdfBlob) return;

      // Convert PDF to base64
      const reader = new FileReader();
      const base64PDF = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(pdfBlob);
      });

      // Prepare email parameters
      const templateParams = {
        to_email: clientReportData.clientEmail,
        client_name: clientReportData.clientName,
        property_name: clientReportData.propertyName,
        property_address: clientReportData.propertyAddress,
        completed_at: clientReportData.completedDate,
        notes: clientReportData.notes,
        pdf_attachment: base64PDF,
        pdf_filename: `Snow_Removal_Report_${clientReportData.propertyName.replace(/\s/g, '_')}.pdf`
      };

      // Send email
      const response = await window.emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      if (response.status === 200) {
        alert(`✅ PDF report sent successfully to ${clientReportData.clientEmail}!`);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      alert(`❌ Failed to send email: ${error.text || error.message}\n\nPlease check your EmailJS configuration.`);
    }
  };

  const downloadPhotosAsZip = async () => {
    if (!clientReportData.photos || clientReportData.photos.length === 0) {
      alert('No photos to download');
      return;
    }

    // Load JSZip library dynamically
    if (!window.JSZip) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.async = true;
      document.body.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    try {
      const zip = new window.JSZip();
      const promises = [];

      // Fetch each photo and add to zip
      clientReportData.photos.forEach((photo, index) => {
        const promise = fetch(photo.photo_url)
          .then(response => response.blob())
          .then(blob => {
            const extension = photo.photo_url.split('.').pop().split('?')[0] || 'jpg';
            const fileName = `${photo.photo_type}_${index + 1}.${extension}`;
            zip.file(fileName, blob);
          })
          .catch(err => console.error(`Failed to fetch photo ${index}:`, err));

        promises.push(promise);
      });

      await Promise.all(promises);

      // Generate and download zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${clientReportData.propertyName}_Photos_${new Date().toLocaleDateString().replace(/\//g, '-')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Downloaded ${clientReportData.photos.length} photos as ZIP file!`);
    } catch (error) {
      console.error('Error creating zip:', error);
      alert('Error creating ZIP file. Please try again.');
    }
  };

  const addOrUpdateProperty = async () => {
    if (!propertyForm.client_id || !propertyForm.address) {
      alert('Please fill in all required fields (Client and Address)');
      return;
    }
    
    if (selectedChecklistItems.length === 0) {
      alert('Please select at least one service from the checklist');
      return;
    }
    
    if (propertyForm.highlight_photos.length === 0) {
      alert('Please upload at least one property photo');
      return;
    }
    
    const checklistData = selectedChecklistItems.map(item => ({ item, checked: false }));
    const propertyData = {
      client_id: propertyForm.client_id,
      name: propertyForm.property_name,
      property_name: propertyForm.property_name,
      address: propertyForm.address,
      latitude: propertyForm.latitude || null,
      longitude: propertyForm.longitude || null,
      highlight_photo_url: propertyForm.highlight_photos[0],
      photo_urls: JSON.stringify(propertyForm.highlight_photos),
      special_notes: propertyForm.special_notes || null,
      checklist: JSON.stringify(checklistData)
    };
    
    if (editingItem) {
      const { error } = await supabase.from('properties').update(propertyData).eq('id', editingItem.id);
      if (!error) {
        alert('Property updated successfully!');
        setEditingItem(null);
      } else {
        alert('Error updating property: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('properties').insert([propertyData]);
      if (!error) {
        alert('Property added successfully!');
      } else {
        alert('Error adding property: ' + error.message);
      }
    }
    
    setShowPropertyModal(false);
    setPropertyForm({ client_id: '', property_name: '', address: '', latitude: '', longitude: '', highlight_photos: [], special_notes: '', checklist: [] });
    setSelectedChecklistItems([]);
    loadProperties();
  };

  const editWorker = (worker) => {
    setEditingItem(worker);
    setWorkerForm({ name: worker.name, email: worker.email, phone: worker.phone || '' });
    setShowWorkerModal(true);
  };

  const editClient = (client) => {
    setEditingItem(client);
    setClientForm({ name: client.name, email: client.email || '', phone: client.phone || '' });
    setShowClientModal(true);
  };

  const editProperty = (property) => {
    setEditingItem(property);
    const checklist = typeof property.checklist === 'string' ? JSON.parse(property.checklist) : property.checklist;
    setSelectedChecklistItems(checklist.map(c => c.item));

    // Load photos from photo_urls or fallback to highlight_photo_url
    const photos = property.photo_urls
      ? (typeof property.photo_urls === 'string' ? JSON.parse(property.photo_urls) : property.photo_urls)
      : (property.highlight_photo_url ? [property.highlight_photo_url] : []);

    setPropertyForm({
      client_id: property.client_id,
      property_name: property.property_name,
      address: property.address,
      latitude: property.latitude || '',
      longitude: property.longitude || '',
      highlight_photos: photos,
      special_notes: property.special_notes || '',
      checklist: checklist
    });
    setShowPropertyModal(true);
  };

  const deleteWorker = async (id) => {
    if (window.confirm('Delete this worker?')) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (!error) loadWorkers();
      else alert('Error: ' + error.message);
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm('Delete this client? Properties and jobs will also be deleted.')) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (!error) {
        loadClients();
        loadProperties();
        loadJobs();
      } else alert('Error: ' + error.message);
    }
  };

  const deleteProperty = async (id) => {
    if (window.confirm('Delete this property? Related jobs will also be deleted.')) {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (!error) {
        loadProperties();
        loadJobs();
      } else alert('Error: ' + error.message);
    }
  };

  const deleteJob = async (id) => {
    if (window.confirm('Delete this job?')) {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (!error) loadJobs();
      else alert('Error: ' + error.message);
    }
  };

  const toggleChecklistItem = (item) => {
    if (selectedChecklistItems.includes(item)) {
      setSelectedChecklistItems(selectedChecklistItems.filter(i => i !== item));
    } else {
      setSelectedChecklistItems([...selectedChecklistItems, item]);
    }
  };

  const addCustomChecklistItem = () => {
    if (customChecklistItem.trim()) {
      setSelectedChecklistItems([...selectedChecklistItems, customChecklistItem.trim()]);
      setCustomChecklistItem('');
    }
  };

  const geocodeAddress = async (address) => {
    if (!address || address.trim().length < 5) {
      alert('Please enter a valid address first');
      return;
    }

    try {
      // Using Nominatim (OpenStreetMap) - Free geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setPropertyForm({
          ...propertyForm,
          latitude: lat,
          longitude: lon
        });
        alert(`✅ Coordinates found!\n\nAddress: ${display_name}\nLatitude: ${lat}\nLongitude: ${lon}`);
      } else {
        alert('❌ Could not find coordinates for this address.\n\nPlease:\n1. Check the address spelling\n2. Include city and postal code\n3. Or enter coordinates manually');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error finding coordinates. Please try again or enter manually.');
    }
  };

  const uploadPropertyPhoto = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const uploadedUrls = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `property-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('job-photos').upload(filePath, file);

      if (uploadError) {
        alert('Error uploading photo: ' + uploadError.message);
        continue;
      }

      const { data } = supabase.storage.from('job-photos').getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);
    }

    if (uploadedUrls.length > 0) {
      setPropertyForm({ ...propertyForm, highlight_photos: [...propertyForm.highlight_photos, ...uploadedUrls] });
      alert(`${uploadedUrls.length} photo(s) uploaded successfully!`);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = propertyForm.highlight_photos.filter((_, i) => i !== index);
    setPropertyForm({ ...propertyForm, highlight_photos: newPhotos });
  };

  const stats = {
    totalWorkers: workers.length,
    totalClients: clients.length,
    totalProperties: properties.length,
    jobsToday: jobs.filter(j => j.scheduled_date === new Date().toISOString().split('T')[0]).length,
    jobsCompleted: jobs.filter(j => j.status === 'completed').length,
    jobsPending: jobs.filter(j => j.status === 'assigned').length
  };

  const filteredWorkers = workers.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProperties = properties.filter(p => p.property_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.address.toLowerCase().includes(searchTerm.toLowerCase()));


  const DashboardView = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Dashboard Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div onClick={() => setActiveTab('workers')} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', color: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>👷 Workers Management</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{workers.length}</p>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>workers</p>
        </div>

        <div onClick={() => setActiveTab('clients')} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', color: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>👥 Clients Management</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{clients.length}</p>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>clients</p>
        </div>

        <div onClick={() => setActiveTab('properties')} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', color: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>🏠 Properties</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{properties.length}</p>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>properties</p>
        </div>

        <div onClick={() => setActiveTab('jobs')} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', color: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>📋 Jobs Management</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{jobs.length}</p>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>total jobs</p>
        </div>

        <div onClick={() => setActiveTab('today')} style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', color: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>📅 Today's Jobs</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{jobs.filter(j => j.scheduled_date === new Date().toISOString().split('T')[0]).length}</p>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>today</p>
        </div>

        <div onClick={() => setActiveTab('completed')} style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', color: '#1f2937' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>✅ Completed Jobs</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{jobs.filter(j => j.status === 'completed').length}</p>
          <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>completed</p>
        </div>

        <div onClick={() => setActiveTab('pending')} style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', color: '#1f2937' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>⏳ Pending Jobs</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{jobs.filter(j => j.status === 'assigned').length}</p>
          <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>pending</p>
        </div>

        <div onClick={() => setActiveTab('issues')} style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', color: '#1f2937', position: 'relative' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>⚠️ Reported Issues</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{issues.filter(i => !i.resolved).length}</p>
          <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '5px' }}>unresolved</p>
          {issues.filter(i => !i.resolved).length > 0 && (
            <span style={{ position: 'absolute', top: '16px', right: '16px', background: '#ef4444', color: 'white', borderRadius: '12px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>
              {issues.filter(i => !i.resolved).length}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const WorkersView = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Workers</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
            <button onClick={() => setViewModes({...viewModes, workers: 'grid'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.workers === 'grid' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.workers === 'grid' ? '#2563eb' : '#6b7280' }}>
              <Grid3x3 size={14} /> Grid
            </button>
            <button onClick={() => setViewModes({...viewModes, workers: 'list'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.workers === 'list' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.workers === 'list' ? '#2563eb' : '#6b7280' }}>
              <List size={14} /> List
            </button>
          </div>
          <button onClick={() => { setEditingItem(null); setShowWorkerModal(true); }} style={{ background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500' }}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}><SearchBar value={searchTerm} onChange={handleSearchChange} /></div>

      {viewModes.workers === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {filteredWorkers.map(worker => (
          <div key={worker.id} style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div><h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{worker.name}</h3><p style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>{worker.role}</p></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => editWorker(worker)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit size={18} /></button>
                <button onClick={() => deleteWorker(worker.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={18} /></button>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              <p style={{ marginBottom: '8px' }}>📧 {worker.email}</p>
              <p style={{ marginBottom: '12px' }}>📱 {worker.phone || 'N/A'}</p>
            </div>
            <button
              onClick={() => {
                const newPassword = prompt(`Reset password for ${worker.name}\n\nEnter new password (min. 6 characters):`);
                if (newPassword && newPassword.length >= 6) {
                  alert(`Password reset instructions:\n\n1. Delete this worker (${worker.name})\n2. Create a new worker with:\n   - Same name: ${worker.name}\n   - Same email: ${worker.email}\n   - New password: ${newPassword}\n\nThis ensures the worker can login with the new password.`);
                } else if (newPassword) {
                  alert('Password must be at least 6 characters');
                }
              }}
              style={{
                width: '100%',
                padding: '8px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              🔑 Reset Password
            </button>
          </div>
        ))}
      </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 100px', gap: '12px', padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div></div>
          </div>
          {filteredWorkers.map(worker => (
            <div key={worker.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 100px', gap: '12px', padding: '12px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', alignItems: 'center' }}>
              <div style={{ fontWeight: '600' }}>{worker.name}</div>
              <div style={{ color: '#6b7280' }}>{worker.email}</div>
              <div style={{ color: '#6b7280' }}>{worker.phone || 'N/A'}</div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                <button onClick={() => editWorker(worker)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }} title="Edit"><Edit size={16} /></button>
                <button onClick={() => deleteWorker(worker.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }} title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ClientsView = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Clients</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
            <button onClick={() => setViewModes({...viewModes, clients: 'grid'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.clients === 'grid' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.clients === 'grid' ? '#2563eb' : '#6b7280' }}>
              <Grid3x3 size={14} /> Grid
            </button>
            <button onClick={() => setViewModes({...viewModes, clients: 'list'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.clients === 'list' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.clients === 'list' ? '#2563eb' : '#6b7280' }}>
              <List size={14} /> List
            </button>
          </div>
          <button onClick={() => { setBulkClientText(''); setShowBulkClientModal(true); }} style={{ background: '#0891b2', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500' }}>
            <Upload size={16} /> Bulk
          </button>
          <button onClick={() => { setEditingItem(null); setShowClientModal(true); }} style={{ background: '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500' }}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}><SearchBar value={searchTerm} onChange={handleSearchChange} /></div>

      {viewModes.clients === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {filteredClients.map(client => (
          <div key={client.id} style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div><h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{client.name}</h3><p style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Client</p></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => editClient(client)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit size={18} /></button>
                <button onClick={() => deleteClient(client.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={18} /></button>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              <p style={{ marginBottom: '8px' }}>📧 {client.email || 'N/A'}</p>
              <p>📱 {client.phone || 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 100px', gap: '12px', padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div></div>
          </div>
          {filteredClients.map(client => (
            <div key={client.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 100px', gap: '12px', padding: '12px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', alignItems: 'center' }}>
              <div style={{ fontWeight: '600' }}>{client.name}</div>
              <div style={{ color: '#6b7280' }}>{client.email}</div>
              <div style={{ color: '#6b7280' }}>{client.phone || 'N/A'}</div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                <button onClick={() => editClient(client)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }} title="Edit"><Edit size={16} /></button>
                <button onClick={() => deleteClient(client.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }} title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PropertiesView = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Properties</h2>
          {selectedProperties.length > 0 && (
            <span style={{ fontSize: '14px', color: '#6b7280' }}>({selectedProperties.length} selected)</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedProperties.length > 0 && (
            <button
              onClick={async () => {
                if (window.confirm(`Delete ${selectedProperties.length} selected properties?`)) {
                  const { error } = await supabase.from('properties').delete().in('id', selectedProperties);
                  if (!error) {
                    alert(`Deleted ${selectedProperties.length} properties successfully!`);
                    setSelectedProperties([]);
                    loadProperties();
                  } else {
                    alert('Error deleting properties: ' + error.message);
                  }
                }
              }}
              style={{ background: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500' }}
            >
              <Trash2 size={16} /> Delete ({selectedProperties.length})
            </button>
          )}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
            <button onClick={() => setViewModes({...viewModes, properties: 'grid'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.properties === 'grid' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.properties === 'grid' ? '#2563eb' : '#6b7280' }}>
              <Grid3x3 size={14} /> Grid
            </button>
            <button onClick={() => setViewModes({...viewModes, properties: 'list'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.properties === 'list' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.properties === 'list' ? '#2563eb' : '#6b7280' }}>
              <List size={14} /> List
            </button>
          </div>
          <button onClick={() => { setEditingItem(null); setShowPropertyModal(true); }} style={{ background: '#9333ea', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500' }}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <SearchBar value={searchTerm} onChange={handleSearchChange} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={filteredProperties.length > 0 && filteredProperties.every(p => selectedProperties.includes(p.id))}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedProperties([...new Set([...selectedProperties, ...filteredProperties.map(p => p.id)])]);
              } else {
                setSelectedProperties(selectedProperties.filter(id => !filteredProperties.find(p => p.id === id)));
              }
            }}
            style={{ cursor: 'pointer' }}
          />
          Select All
        </label>
      </div>

      {viewModes.properties === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {filteredProperties.map(property => {
            const photos = property.photo_urls
              ? (typeof property.photo_urls === 'string' ? JSON.parse(property.photo_urls) : property.photo_urls)
              : (property.highlight_photo_url ? [property.highlight_photo_url] : []);
            const currentPhotoIndex = propertyPhotoIndexes[property.id] || 0;

            return (
              <div key={property.id} style={{ background: 'white', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: selectedProperties.includes(property.id) ? '2px solid #2563eb' : '1px solid #e5e7eb', position: 'relative' }}>
                <input
                  type="checkbox"
                  checked={selectedProperties.includes(property.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProperties([...selectedProperties, property.id]);
                    } else {
                      setSelectedProperties(selectedProperties.filter(id => id !== property.id));
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'absolute', top: '8px', left: '8px', width: '16px', height: '16px', cursor: 'pointer', zIndex: 10 }}
                />
                {photos.length > 0 && (
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <img src={photos[currentPhotoIndex]} alt="Property" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px' }} />
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setPropertyPhotoIndexes({ ...propertyPhotoIndexes, [property.id]: (currentPhotoIndex - 1 + photos.length) % photos.length })}
                          style={{ position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '16px', lineHeight: '1' }}
                        >‹</button>
                        <button
                          onClick={() => setPropertyPhotoIndexes({ ...propertyPhotoIndexes, [property.id]: (currentPhotoIndex + 1) % photos.length })}
                          style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '16px', lineHeight: '1' }}
                        >›</button>
                        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>
                          {currentPhotoIndex + 1}/{photos.length}
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.property_name}</h3>
                    <p style={{ color: '#6b7280', fontSize: '11px' }}>{property.clients?.name}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
                    <button onClick={() => editProperty(property)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '2px' }}><Edit size={14} /></button>
                    <button onClick={() => deleteProperty(property.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <p style={{ color: '#374151', fontSize: '11px', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {property.address}</p>
                {property.special_notes && (
                  <p style={{ fontSize: '10px', color: '#92400e', background: '#fef3c7', padding: '4px 6px', borderRadius: '4px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📝 {property.special_notes}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 3fr 100px', gap: '12px', padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>
            <div></div>
            <div>Property Name</div>
            <div>Client</div>
            <div>Address</div>
            <div></div>
          </div>
          {filteredProperties.map(property => (
            <div key={property.id} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 3fr 100px', gap: '12px', padding: '12px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', alignItems: 'center', background: selectedProperties.includes(property.id) ? '#eff6ff' : 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedProperties.includes(property.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProperties([...selectedProperties, property.id]);
                    } else {
                      setSelectedProperties(selectedProperties.filter(id => id !== property.id));
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>
              <div style={{ fontWeight: '600' }}>{property.property_name}</div>
              <div style={{ color: '#6b7280' }}>{property.clients?.name || 'N/A'}</div>
              <div style={{ color: '#6b7280' }}>{property.address}</div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                <button onClick={() => editProperty(property)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }} title="Edit"><Edit size={16} /></button>
                <button onClick={() => deleteProperty(property.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }} title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const JobsView = () => {
    const [statusFilter, setStatusFilter] = useState('all'); // all, assigned, in_progress, completed
    const [jobTypeFilter, setJobTypeFilter] = useState('all'); // all, recurring, one-time

    // Apply date filter
    const getDateFilteredJobs = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return jobs.filter(job => {
        const jobDate = new Date(job.scheduled_date);
        jobDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            return jobDate.getTime() === today.getTime();
          case 'tomorrow':
            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
            return jobDate >= today && jobDate < dayAfterTomorrow;
          case 'week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return jobDate >= today && jobDate < weekFromNow;
          case 'month':
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            return jobDate >= today && jobDate < monthFromNow;
          case 'custom':
            if (!startDate && !endDate) return true;
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);
            if (start && end) return jobDate >= start && jobDate <= end;
            if (start) return jobDate >= start;
            if (end) return jobDate <= end;
            return true;
          case 'all':
          default:
            return true;
        }
      });
    };

    // Apply status filter
    const getFilteredJobs = () => {
      let filtered = getDateFilteredJobs();

      if (statusFilter !== 'all') {
        filtered = filtered.filter(job => job.status === statusFilter);
      }

      return filtered;
    };

    const filteredJobs = getFilteredJobs();

    // Deduplicate by property + worker combination (only if deduplication is enabled)
    let displayableJobs = filteredJobs;

    if (deduplicateRecurring) {
      // Group by property_id + worker_id combination
      const seenCombinations = new Set();
      displayableJobs = filteredJobs.filter(job => {
        const key = `${job.property_id}-${job.worker_id}`;
        if (seenCombinations.has(key)) {
          return false; // Hide this job (duplicate combination)
        }
        seenCombinations.add(key);
        return true; // Show this job (first occurrence)
      });
    }

    // Apply job type filter
    if (jobTypeFilter === 'recurring') {
      displayableJobs = displayableJobs.filter(job => job.recurring_group_id);
    } else if (jobTypeFilter === 'one-time') {
      displayableJobs = displayableJobs.filter(job => !job.recurring_group_id);
    }

    // Group displayable jobs by worker and sort VIP jobs first
    const jobsByWorker = displayableJobs.reduce((acc, item) => {
      const workerId = item.worker_id || 'unassigned';
      const workerName = item.workers?.name || 'Unassigned';
      if (!acc[workerId]) {
        acc[workerId] = { workerName, jobs: [] };
      }
      acc[workerId].jobs.push(item);
      return acc;
    }, {});

    // Sort VIP jobs first within each worker's jobs
    Object.values(jobsByWorker).forEach(workerData => {
      workerData.jobs.sort((a, b) => {
        // VIP jobs come first
        if (a.is_vip && !b.is_vip) return -1;
        if (!a.is_vip && b.is_vip) return 1;
        // Then sort by scheduled date
        return new Date(a.scheduled_date) - new Date(b.scheduled_date);
      });
    });

    const changeWorker = async (jobId, newWorkerId) => {
      if (!newWorkerId) {
        alert('Please select a worker');
        return;
      }

      const { error } = await supabase
        .from('jobs')
        .update({ worker_id: newWorkerId })
        .eq('id', jobId);

      if (!error) {
        alert('Worker changed successfully!');
        setEditingJobId(null);
        setNewWorkerId('');
        loadJobs();
      } else {
        alert('Error changing worker: ' + error.message);
      }
    };

    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Jobs</h2>
            {selectedJobs.length > 0 && (
              <span style={{ fontSize: '14px', color: '#6b7280' }}>({selectedJobs.length} selected)</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {selectedJobs.length > 0 && (
              <button
                onClick={async () => {
                  if (window.confirm(`Delete ${selectedJobs.length} selected jobs?`)) {
                    const { error } = await supabase.from('jobs').delete().in('id', selectedJobs);
                    if (!error) {
                      alert(`Deleted ${selectedJobs.length} jobs successfully!`);
                      setSelectedJobs([]);
                      loadJobs();
                    } else {
                      alert('Error deleting jobs: ' + error.message);
                    }
                  }
                }}
                style={{ background: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500' }}
              >
                <Trash2 size={16} /> Delete ({selectedJobs.length})
              </button>
            )}
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
              <button onClick={() => setViewModes({...viewModes, jobs: 'grid'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.jobs === 'grid' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.jobs === 'grid' ? '#2563eb' : '#6b7280' }}>
                <Grid3x3 size={14} /> Grid
              </button>
              <button onClick={() => setViewModes({...viewModes, jobs: 'list'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.jobs === 'list' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.jobs === 'list' ? '#2563eb' : '#6b7280' }}>
                <List size={14} /> List
              </button>
            </div>
            <button onClick={() => setShowJobModal(true)} style={{ background: '#ea580c', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500' }}>
              <Plus size={16} /> Assign
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}><SearchBar value={searchTerm} onChange={handleSearchChange} /></div>

        {/* Filters - Compact */}
        <div style={{ background: 'white', padding: '10px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

          {/* Global Publish Toggle - Compact */}
          <div style={{ marginBottom: '10px', padding: '10px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #2563eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
                  🌐 Global Publish Control
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={async () => {
                    const totalJobs = displayableJobs.length;
                    if (window.confirm(`Publish ALL ${totalJobs} jobs for ALL workers?\n\nWorkers will immediately see all these jobs.`)) {
                      const jobIds = displayableJobs.map(job => job.id);
                      const { error } = await supabase
                        .from('jobs')
                        .update({ published: true })
                        .in('id', jobIds);

                      if (!error) {
                        loadJobs();
                        alert(`✅ Published ${totalJobs} jobs successfully!`);
                      } else {
                        alert('Error: ' + error.message);
                      }
                    }
                  }}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  👁️ Publish All
                </button>
                <button
                  onClick={async () => {
                    const totalJobs = displayableJobs.length;
                    if (window.confirm(`Unpublish ALL ${totalJobs} jobs for ALL workers?\n\nWorkers will NOT see any of these jobs.`)) {
                      const jobIds = displayableJobs.map(job => job.id);
                      const { error } = await supabase
                        .from('jobs')
                        .update({ published: false })
                        .in('id', jobIds);

                      if (!error) {
                        loadJobs();
                        alert(`🔒 Unpublished ${totalJobs} jobs successfully!`);
                      } else {
                        alert('Error: ' + error.message);
                      }
                    }
                  }}
                  style={{
                    background: '#9ca3af',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  🔒 Unpublish All
                </button>
              </div>
            </div>
          </div>

          {/* Deduplicate Toggle - Compact */}
          <div style={{ marginBottom: '10px', padding: '10px', background: deduplicateRecurring ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${deduplicateRecurring ? '#10b981' : '#ef4444'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', userSelect: 'none' }}>
                {deduplicateRecurring ? '✅ Hide duplicate jobs' : '⚠️ Showing duplicates'}
              </div>
              <input
                type="checkbox"
                checked={deduplicateRecurring}
                onChange={(e) => {
                  e.stopPropagation();
                  setDeduplicateRecurring(e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Filters - Horizontal Layout */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

            {/* Date Range */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>📅 Date Range</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { value: 'today', label: 'Today', icon: '📅' },
                  { value: 'tomorrow', label: 'Today & Tomorrow', icon: '📆' },
                  { value: 'week', label: '7 Days', icon: '📆' },
                  { value: 'month', label: '30 Days', icon: '🗓️' },
                  { value: 'custom', label: 'Custom', icon: '🔍' },
                  { value: 'all', label: 'All', icon: '∞' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setDateFilter(filter.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: dateFilter === filter.value ? '2px solid #2563eb' : '1px solid #d1d5db',
                      background: dateFilter === filter.value ? '#dbeafe' : 'white',
                      color: dateFilter === filter.value ? '#1e40af' : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: dateFilter === filter.value ? '600' : '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {filter.icon} {filter.label}
                  </button>
                ))}
              </div>
              {/* Custom Date Range Picker */}
              {dateFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>📊 Status</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'All', color: '#6b7280' },
                  { value: 'assigned', label: 'Assigned', color: '#2563eb' },
                  { value: 'in_progress', label: 'In Progress', color: '#f59e0b' },
                  { value: 'completed', label: 'Completed', color: '#10b981' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: statusFilter === filter.value ? `2px solid ${filter.color}` : '1px solid #d1d5db',
                      background: statusFilter === filter.value ? `${filter.color}15` : 'white',
                      color: statusFilter === filter.value ? filter.color : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: statusFilter === filter.value ? '600' : '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Type */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>🔁 Job Type</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'All', icon: '📋' },
                  { value: 'recurring', label: 'Recurring', icon: '🔁' },
                  { value: 'one-time', label: 'One-Time', icon: '📝' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setJobTypeFilter(filter.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: jobTypeFilter === filter.value ? '2px solid #9333ea' : '1px solid #d1d5db',
                      background: jobTypeFilter === filter.value ? '#f3e8ff' : 'white',
                      color: jobTypeFilter === filter.value ? '#7e22ce' : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: jobTypeFilter === filter.value ? '600' : '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {filter.icon} {filter.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Results count */}
          <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #2563eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
              <strong>Showing {displayableJobs.length} jobs</strong>
              {deduplicateRecurring && filteredJobs.length > displayableJobs.length && ` (${filteredJobs.length - displayableJobs.length} duplicates hidden)`}
              {dateFilter !== 'all' && ` • ${dateFilter === 'today' ? 'Today' : dateFilter === 'tomorrow' ? 'Today & Tomorrow' : dateFilter === 'week' ? 'Next 7 days' : dateFilter === 'month' ? 'Next 30 days' : dateFilter === 'custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` : ''}`}
              {statusFilter !== 'all' && ` • ${statusFilter}`}
              {jobTypeFilter === 'recurring' && ` • Recurring only`}
              {jobTypeFilter === 'one-time' && ` • One-time only`}
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={displayableJobs.filter(j => j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) || j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 && displayableJobs.filter(j => j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) || j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase())).every(j => selectedJobs.includes(j.id))}
                onChange={(e) => {
                  const visibleJobs = displayableJobs.filter(j => j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) || j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase()));
                  if (e.target.checked) {
                    setSelectedJobs([...new Set([...selectedJobs, ...visibleJobs.map(j => j.id)])]);
                  } else {
                    setSelectedJobs(selectedJobs.filter(id => !visibleJobs.find(j => j.id === id)));
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
              Select All
            </label>
          </div>
        </div>

        {viewModes.jobs === 'grid' ? (
          /* Grouped Grid View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(jobsByWorker).map(([workerId, { workerName, jobs: workerJobs }]) => {
            const isExpanded = expandedWorkers[workerId] !== false; // Default to expanded
            const visibleJobs = workerJobs.filter(j =>
              j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (visibleJobs.length === 0) return null;

            return (
              <div key={workerId} style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {/* Worker Header */}
                <div
                  onClick={() => setExpandedWorkers({ ...expandedWorkers, [workerId]: !isExpanded })}
                  style={{ padding: '10px 12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>{workerName} <span style={{ fontSize: '12px', opacity: 0.9, fontWeight: 'normal' }}>({visibleJobs.length} jobs)</span></h3>
                  <span style={{ fontSize: '18px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>

                {/* Jobs Grid */}
                {isExpanded && (
                <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {visibleJobs.map(job => (
                    <div key={job.id} style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px', border: selectedJobs.includes(job.id) ? '2px solid #2563eb' : job.is_vip ? '2px solid #fbbf24' : '1px solid #e5e7eb', position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJobs([...selectedJobs, job.id]);
                          } else {
                            setSelectedJobs(selectedJobs.filter(id => id !== job.id));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'absolute', top: '10px', right: '10px', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      {job.is_vip && <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', marginBottom: '6px', display: 'inline-block' }}>⭐ VIP</span>}
                      <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '6px', paddingRight: '24px' }}>{job.properties?.property_name}</h3>
                      <p style={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}>📅 {job.scheduled_date}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '500', background: job.status === 'completed' ? '#d1fae5' : job.status === 'in_progress' ? '#fef3c7' : '#dbeafe', color: job.status === 'completed' ? '#065f46' : job.status === 'in_progress' ? '#92400e' : '#1e40af' }}>
                          {job.status}
                        </span>
                        {job.published && <span style={{ fontSize: '10px' }}>👁️</span>}
                        {job.recurring_group_id && <span style={{ fontSize: '10px' }}>🔁</span>}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            );
          })}
          </div>
        ) : (
          /* Grouped View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(jobsByWorker).map(([workerId, { workerName, jobs: workerJobs }]) => {
            const isExpanded = expandedWorkers[workerId] !== false; // Default to expanded
            const visibleJobs = workerJobs.filter(j =>
              j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (visibleJobs.length === 0) return null;

            const allJobsExpanded = visibleJobs.every(job => expandedJobs[job.id] !== false);

            return (
              <div key={workerId} style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {/* Worker Header - Compact */}
                <div
                  style={{ padding: '10px 12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div
                    onClick={() => setExpandedWorkers({ ...expandedWorkers, [workerId]: !isExpanded })}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>{workerName} <span style={{ fontSize: '12px', opacity: 0.9, fontWeight: 'normal' }}>({visibleJobs.length} jobs)</span></h3>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Expand All Jobs */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newState = {};
                        visibleJobs.forEach(job => {
                          newState[job.id] = !allJobsExpanded;
                        });
                        setExpandedJobs({ ...expandedJobs, ...newState });
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '11px'
                      }}
                      title={allJobsExpanded ? 'Collapse all jobs' : 'Expand all jobs'}
                    >
                      {allJobsExpanded ? '⊟ Collapse All' : '⊞ Expand All'}
                    </button>

                    {/* Master Publish Toggle */}
                    {(() => {
                      const allPublished = visibleJobs.every(job => job.published);
                      const publishedCount = visibleJobs.filter(job => job.published).length;

                      return (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const newState = !allPublished;
                            const jobIds = visibleJobs.map(job => job.id);

                            if (window.confirm(`${newState ? 'Publish' : 'Unpublish'} all ${visibleJobs.length} jobs for ${workerName}?`)) {
                              const { error } = await supabase
                                .from('jobs')
                                .update({ published: newState })
                                .in('id', jobIds);

                              if (!error) {
                                loadJobs();
                                alert(`${newState ? 'Published' : 'Unpublished'} ${visibleJobs.length} jobs successfully!`);
                              } else {
                                alert('Error: ' + error.message);
                              }
                            }
                          }}
                          style={{
                            background: allPublished ? '#10b981' : '#9ca3af',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '11px'
                          }}
                          title={`${publishedCount}/${visibleJobs.length} jobs published`}
                        >
                          {allPublished ? '👁️' : '🔒'}
                          {publishedCount > 0 && publishedCount < visibleJobs.length && (
                            <span style={{ fontSize: '10px', marginLeft: '4px' }}>{publishedCount}/{visibleJobs.length}</span>
                          )}
                        </button>
                      );
                    })()}

                    <div
                      onClick={() => setExpandedWorkers({ ...expandedWorkers, [workerId]: !isExpanded })}
                      style={{ fontSize: '18px', cursor: 'pointer' }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {/* Jobs List - Collapsible */}
                {isExpanded && (
                  <div style={{ padding: '8px' }}>
                    {visibleJobs.map(job => {
                      const isJobExpanded = expandedJobs[job.id] !== false;

                      return (
                        <div
                          key={job.id}
                          style={{
                            background: job.is_vip ? '#fef2f2' : '#f9fafb',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            marginBottom: '6px',
                            border: job.is_vip ? '1px solid #fca5a5' : '1px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => setExpandedJobs({ ...expandedJobs, [job.id]: !isJobExpanded })}
                        >
                          {/* Collapsed View - Compact */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '14px', flexShrink: 0 }}>{isJobExpanded ? '▼' : '▶'}</span>
                              <h4 style={{ fontSize: '13px', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {job.properties?.property_name}
                              </h4>
                              {job.is_vip && <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 'bold', background: '#dc2626', color: 'white', flexShrink: 0 }}>VIP</span>}
                              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '500', background: job.status === 'completed' ? '#d1fae5' : job.status === 'in_progress' ? '#fef3c7' : '#dbeafe', color: job.status === 'completed' ? '#065f46' : job.status === 'in_progress' ? '#92400e' : '#1e40af', flexShrink: 0 }}>
                                {job.status}
                              </span>
                              <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 'bold', background: job.published ? '#10b981' : '#9ca3af', color: 'white', flexShrink: 0 }}>
                                {job.published ? '👁️' : '🔒'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditingJobId(job.id);
                                  setNewWorkerId(job.worker_id);
                                }}
                                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '2px' }}
                                title="Change Worker"
                              >
                                <Edit size={14} />
                              </button>
                              <button onClick={() => deleteJob(job.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}><Trash2 size={14} /></button>
                            </div>
                          </div>

                          {/* Expanded View - Full Details */}
                          {isJobExpanded && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }} onClick={(e) => e.stopPropagation()}>
                              <p style={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}>📍 {job.properties?.address}</p>
                              <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>📅 {job.scheduled_date}</p>
                              {job.recurring_group_id && <p style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600', marginBottom: '4px' }}>🔁 Recurring Job</p>}
                              {job.is_vip && job.deadline_time && <p style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600', marginBottom: '4px' }}>⏰ Deadline: {job.deadline_time}</p>}
                              {job.start_time && <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Started: {new Date(job.start_time).toLocaleString()}</p>}
                              {job.end_time && <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Completed: {new Date(job.end_time).toLocaleString()}</p>}

                              {/* Time Tracking */}
                              {job.estimated_duration_minutes && (
                                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                  ⏱️ Est: {job.estimated_duration_minutes >= 60 ? `${Math.floor(job.estimated_duration_minutes / 60)}h ${job.estimated_duration_minutes % 60}m` : `${job.estimated_duration_minutes}m`}
                                  {job.actual_duration_minutes && (
                                    <span style={{ marginLeft: '8px', color: job.actual_duration_minutes <= job.estimated_duration_minutes ? '#059669' : '#dc2626', fontWeight: '600' }}>
                                      | Actual: {job.actual_duration_minutes >= 60 ? `${Math.floor(job.actual_duration_minutes / 60)}h ${job.actual_duration_minutes % 60}m` : `${job.actual_duration_minutes}m`}
                                      {job.actual_duration_minutes <= job.estimated_duration_minutes
                                        ? ` ✓`
                                        : ` (${job.actual_duration_minutes - job.estimated_duration_minutes}m over)`
                                      }
                                    </span>
                                  )}
                                </p>
                              )}

                              {/* Change Worker UI */}
                              {editingJobId === job.id && (
                                <div style={{ marginTop: '8px', padding: '8px', background: 'white', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                                  <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>Change Worker:</p>
                                  <select
                                    value={newWorkerId}
                                    onChange={(e) => setNewWorkerId(e.target.value)}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', marginBottom: '6px' }}
                                  >
                                    <option value="">Select Worker</option>
                                    {workers.map(w => (
                                      <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                  </select>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => changeWorker(job.id, newWorkerId)}
                                      style={{ flex: 1, padding: '4px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingJobId(null);
                                        setNewWorkerId('');
                                      }}
                                      style={{ flex: 1, padding: '4px', background: '#d1d5db', color: '#374151', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Job Photos */}
                              {job.job_photos && job.job_photos.length > 0 && (
                                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                                  <p style={{ fontWeight: '600', marginBottom: '6px', fontSize: '11px' }}>Photos ({job.job_photos.length}):</p>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                    {job.job_photos.slice(0, 4).map((photo, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setSelectedPhotos(job.job_photos);
                                          setCurrentPhotoIndex(idx);
                                          setPhotoViewerOpen(true);
                                        }}
                                        style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                      >
                                        <img src={photo.photo_url} alt={photo.photo_type} style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                        <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '8px', padding: '2px 4px', borderRadius: '3px' }}>{photo.photo_type}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {job.job_photos.length > 4 && (
                                    <button
                                      onClick={() => {
                                        setSelectedPhotos(job.job_photos);
                                        setCurrentPhotoIndex(0);
                                        setPhotoViewerOpen(true);
                                      }}
                                      style={{ marginTop: '6px', padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', width: '100%' }}
                                    >
                                      View all {job.job_photos.length} photos
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    );
  };

  const TodayJobsView = () => {
    const todayJobs = jobs.filter(j => j.scheduled_date === new Date().toISOString().split('T')[0]);
    const filteredJobs = todayJobs.filter(j =>
      j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Today's Jobs <span style={{ fontSize: '16px', color: '#6b7280', fontWeight: 'normal' }}>({filteredJobs.length})</span></h2>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
            <button onClick={() => setViewModes({...viewModes, today: 'grid'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.today === 'grid' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.today === 'grid' ? '#2563eb' : '#6b7280' }}>
              <Grid3x3 size={14} /> Grid
            </button>
            <button onClick={() => setViewModes({...viewModes, today: 'list'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.today === 'list' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.today === 'list' ? '#2563eb' : '#6b7280' }}>
              <List size={14} /> List
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}><SearchBar value={searchTerm} onChange={handleSearchChange} /></div>

        {filteredJobs.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No jobs scheduled for today</p>
        ) : viewModes.today === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {filteredJobs.map(job => (
              <div key={job.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: job.is_vip ? '2px solid #fbbf24' : '1px solid #e5e7eb' }}>
                {job.is_vip && <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', marginBottom: '8px', display: 'inline-block' }}>⭐ VIP</span>}
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{job.properties?.property_name}</h3>
                <p style={{ color: '#6b7280', marginBottom: '4px', fontSize: '13px' }}>👤 {job.workers?.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: job.status === 'completed' ? '#d1fae5' : job.status === 'in_progress' ? '#fef3c7' : '#dbeafe', color: job.status === 'completed' ? '#065f46' : job.status === 'in_progress' ? '#92400e' : '#1e40af' }}>
                    {job.status}
                  </span>
                  {job.published && <span style={{ fontSize: '10px' }}>👁️</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr 60px', gap: '12px', padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>
              <div>Property</div>
              <div>Worker</div>
              <div>Status</div>
              <div>Time</div>
              <div>Published</div>
              <div></div>
            </div>

            {/* Table Rows */}
            {filteredJobs.map(job => (
              <div
                key={job.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr 60px',
                  gap: '12px',
                  padding: '8px 12px',
                  borderBottom: '1px solid #f3f4f6',
                  background: job.is_vip ? '#fef2f2' : 'white',
                  fontSize: '12px',
                  alignItems: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = job.is_vip ? '#fee2e2' : '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.background = job.is_vip ? '#fef2f2' : 'white'}
              >
                {/* Property Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  {job.is_vip && <span style={{ fontSize: '10px' }}>⭐</span>}
                  <span style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.properties?.property_name}>
                    {job.properties?.property_name}
                  </span>
                </div>

                {/* Worker Name */}
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.workers?.name}>
                  {job.workers?.name}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    background: job.status === 'completed' ? '#d1fae5' : job.status === 'in_progress' ? '#fef3c7' : '#dbeafe',
                    color: job.status === 'completed' ? '#065f46' : job.status === 'in_progress' ? '#92400e' : '#1e40af',
                    display: 'inline-block'
                  }}>
                    {job.status === 'in_progress' ? 'in progress' : job.status}
                  </span>
                </div>

                {/* Time */}
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {job.actual_duration_minutes ? (
                    <span style={{ fontWeight: '600', color: '#059669' }}>
                      {job.actual_duration_minutes >= 60 ? `${Math.floor(job.actual_duration_minutes / 60)}h ${job.actual_duration_minutes % 60}m` : `${job.actual_duration_minutes}m`}
                    </span>
                  ) : job.estimated_duration_minutes ? (
                    <span>
                      ~{job.estimated_duration_minutes >= 60 ? `${Math.floor(job.estimated_duration_minutes / 60)}h ${job.estimated_duration_minutes % 60}m` : `${job.estimated_duration_minutes}m`}
                    </span>
                  ) : (
                    <span style={{ color: '#d1d5db' }}>-</span>
                  )}
                </div>

                {/* Published */}
                <div>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    background: job.published ? '#10b981' : '#9ca3af',
                    color: 'white',
                    display: 'inline-block'
                  }}>
                    {job.published ? '👁️' : '🔒'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setEditingJobId(job.id);
                      setNewWorkerId(job.worker_id);
                    }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '2px' }}
                    title="Change Worker"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                    title="Delete Job"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const CompletedJobsView = () => {
    const [dateFilter, setDateFilter] = useState('all'); // today, week, month, all
    const [workerFilter, setWorkerFilter] = useState('all');

    let completedJobs = jobs.filter(j => j.status === 'completed');

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      completedJobs = completedJobs.filter(job => {
        if (!job.finished_at) return false;
        const finishedDate = new Date(job.finished_at);
        finishedDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            return finishedDate.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return finishedDate >= weekAgo && finishedDate <= today;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return finishedDate >= monthAgo && finishedDate <= today;
          default:
            return true;
        }
      });
    }

    // Apply worker filter
    if (workerFilter !== 'all') {
      completedJobs = completedJobs.filter(job => job.worker_id === workerFilter);
    }

    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Completed Jobs</h2>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
            <button onClick={() => setViewModes({...viewModes, completed: 'grid'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.completed === 'grid' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.completed === 'grid' ? '#2563eb' : '#6b7280' }}>
              <Grid3x3 size={14} /> Grid
            </button>
            <button onClick={() => setViewModes({...viewModes, completed: 'list'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.completed === 'list' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.completed === 'list' ? '#2563eb' : '#6b7280' }}>
              <List size={14} /> List
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}><SearchBar value={searchTerm} onChange={handleSearchChange} /></div>

        {/* Filters */}
        <div style={{ background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Date Filter */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>📅 Completed Date</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Last 7 Days' },
                  { value: 'month', label: 'Last 30 Days' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setDateFilter(filter.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: dateFilter === filter.value ? '2px solid #10b981' : '1px solid #d1d5db',
                      background: dateFilter === filter.value ? '#d1fae515' : 'white',
                      color: dateFilter === filter.value ? '#059669' : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: dateFilter === filter.value ? '600' : '500'
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Worker Filter */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>👤 Worker</label>
              <select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                <option value="all">All Workers</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div style={{ marginTop: '12px', padding: '10px', background: '#f0fdf4', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
            <p style={{ fontSize: '13px', color: '#059669', margin: 0, fontWeight: '600' }}>
              Showing {completedJobs.length} completed jobs
              {dateFilter !== 'all' && ` • ${dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Last 7 days' : 'Last 30 days'}`}
              {workerFilter !== 'all' && ` • ${workers.find(w => w.id === workerFilter)?.name}`}
            </p>
          </div>
        </div>

        {viewModes.completed === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          {completedJobs.filter(j => j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) || j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase())).map(job => (
            <div key={job.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{job.properties?.name}</h3>
                <span style={{padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: '#d1fae5', color: '#065f46'}}>completed</span>
              </div>
              <p style={{ color: '#6b7280', marginBottom: '5px', fontSize: '14px' }}>Worker: {job.workers?.name}</p>
              <p style={{ color: '#6b7280', marginBottom: '5px', fontSize: '13px' }}>📅 {job.scheduled_date}</p>
              {job.started_at && <p style={{ fontSize: '12px', color: '#10b981', marginBottom: '4px' }}>▶ Started: {new Date(job.started_at).toLocaleString()}</p>}
              {job.finished_at && <p style={{ fontSize: '12px', color: '#059669', marginBottom: '8px', fontWeight: '600' }}>✓ Completed: {new Date(job.finished_at).toLocaleString()}</p>}

              {/* Time Tracking */}
              {(job.estimated_duration_minutes || job.actual_duration_minutes) && (
                <div style={{ marginTop: '10px', padding: '10px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
                  {job.estimated_duration_minutes && (
                    <div style={{ marginBottom: '4px', color: '#6b7280' }}>
                      ⏱️ Estimated: {job.estimated_duration_minutes >= 60 ? `${Math.floor(job.estimated_duration_minutes / 60)}h ${job.estimated_duration_minutes % 60}m` : `${job.estimated_duration_minutes}m`}
                    </div>
                  )}
                  {job.actual_duration_minutes && (
                    <div style={{ color: '#059669', fontWeight: '600' }}>
                      ✓ Actual: {job.actual_duration_minutes >= 60 ? `${Math.floor(job.actual_duration_minutes / 60)}h ${job.actual_duration_minutes % 60}m` : `${job.actual_duration_minutes}m`}
                    </div>
                  )}
                  {job.estimated_duration_minutes && job.actual_duration_minutes && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: job.actual_duration_minutes <= job.estimated_duration_minutes ? '#059669' : '#dc2626' }}>
                      {job.actual_duration_minutes <= job.estimated_duration_minutes
                        ? `✓ On time (${job.estimated_duration_minutes - job.actual_duration_minutes}m under)`
                        : `⚠️ Over time (${job.actual_duration_minutes - job.estimated_duration_minutes}m over)`
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Job Photos */}
              {job.job_photos && job.job_photos.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>Photos ({job.job_photos.length}):</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {job.job_photos.slice(0, 4).map((photo, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedPhotos(job.job_photos);
                          setCurrentPhotoIndex(idx);
                          setPhotoViewerOpen(true);
                        }}
                        style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <img src={photo.photo_url} alt={photo.photo_type} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                        <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>{photo.photo_type}</span>
                      </div>
                    ))}
                  </div>
                  {job.job_photos.length > 4 && (
                    <button
                      onClick={() => {
                        setSelectedPhotos(job.job_photos);
                        setCurrentPhotoIndex(0);
                        setPhotoViewerOpen(true);
                      }}
                      style={{ marginTop: '8px', padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', width: '100%' }}
                    >
                      View all {job.job_photos.length} photos
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      // Download all photos by fetching and creating blob URLs
                      for (let i = 0; i < job.job_photos.length; i++) {
                        const photo = job.job_photos[i];
                        try {
                          // Fetch the image as blob
                          const response = await fetch(photo.photo_url);
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);

                          // Create download link
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = `${job.properties?.property_name.replace(/\s/g, '_')}_${photo.photo_type}_${i + 1}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);

                          // Clean up blob URL
                          URL.revokeObjectURL(blobUrl);

                          // Delay to prevent browser blocking
                          await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (error) {
                          console.error('Error downloading photo:', error);
                        }
                      }
                      alert(`Downloaded ${job.job_photos.length} photos!`);
                    }}
                    style={{ marginTop: '8px', padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', width: '100%', fontWeight: '600' }}
                  >
                    ⬇️ Download All Photos ({job.job_photos.length})
                  </button>
                </div>
              )}

              {/* Send to Client and Download Photos Buttons */}
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => generateClientReport(job)}
                  style={{ flex: 1, padding: '10px 12px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  📧 Report
                </button>
                {job.job_photos && job.job_photos.length > 0 && (
                  <button
                    onClick={async () => {
                      const report = {
                        photos: job.job_photos || [],
                        propertyName: properties.find(p => p.id === job.property_id)?.property_name || 'Property'
                      };
                      setClientReportData(report);
                      await downloadPhotosAsZip();
                    }}
                    style={{ flex: 1, padding: '10px 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    📦 Photos ZIP
                  </button>
                )}
              </div>
            </div>
          ))}
          {completedJobs.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px', gridColumn: '1 / -1' }}>No completed jobs yet</p>}
        </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1.5fr 80px 200px', gap: '12px', padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>
              <div>Property</div>
              <div>Worker</div>
              <div>Date</div>
              <div>Started</div>
              <div>Completed</div>
              <div>Photos</div>
              <div>Actions</div>
            </div>
            {completedJobs.filter(j => j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) || j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase())).map(job => (
              <div key={job.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1.5fr 80px 200px', gap: '12px', padding: '12px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', alignItems: 'center' }}>
                <div style={{ fontWeight: '600' }}>{job.properties?.property_name}</div>
                <div style={{ color: '#6b7280' }}>{job.workers?.name}</div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>{job.scheduled_date}</div>
                <div style={{ color: '#10b981', fontSize: '11px' }}>{job.started_at ? new Date(job.started_at).toLocaleString() : 'N/A'}</div>
                <div style={{ color: '#059669', fontSize: '11px', fontWeight: '600' }}>{job.finished_at ? new Date(job.finished_at).toLocaleString() : 'N/A'}</div>
                <div style={{ textAlign: 'center' }}>
                  {job.job_photos && job.job_photos.length > 0 ? (
                    <button
                      onClick={() => {
                        setSelectedPhotos(job.job_photos);
                        setCurrentPhotoIndex(0);
                        setPhotoViewerOpen(true);
                      }}
                      style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      {job.job_photos.length} 📷
                    </button>
                  ) : (
                    <span style={{ color: '#d1d5db', fontSize: '11px' }}>—</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => generateClientReport(job)}
                    style={{ flex: 1, padding: '6px 10px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    📧 Report
                  </button>
                  {job.job_photos && job.job_photos.length > 0 && (
                    <button
                      onClick={async () => {
                        const report = {
                          photos: job.job_photos || [],
                          propertyName: properties.find(p => p.id === job.property_id)?.property_name || 'Property'
                        };
                        setClientReportData(report);
                        await downloadPhotosAsZip();
                      }}
                      style={{ flex: 1, padding: '6px 10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      📦 ZIP
                    </button>
                  )}
                </div>
              </div>
            ))}
            {completedJobs.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No completed jobs yet</p>}
          </div>
        )}
      </div>
    );
  };

  const PendingJobsView = () => {
    const pendingJobs = jobs.filter(j => j.status === 'assigned');
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Pending Jobs</h2>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
            <button onClick={() => setViewModes({...viewModes, pending: 'grid'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.pending === 'grid' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.pending === 'grid' ? '#2563eb' : '#6b7280' }}>
              <Grid3x3 size={14} /> Grid
            </button>
            <button onClick={() => setViewModes({...viewModes, pending: 'list'})} style={{ padding: '6px 12px', border: 'none', background: viewModes.pending === 'list' ? 'white' : 'transparent', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: viewModes.pending === 'list' ? '#2563eb' : '#6b7280' }}>
              <List size={14} /> List
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}><SearchBar value={searchTerm} onChange={handleSearchChange} /></div>

        {viewModes.pending === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {pendingJobs.filter(j => j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) || j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase())).map(job => (
              <div key={job.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{job.properties?.name}</h3>
                  <span style={{padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: '#dbeafe', color: '#1e40af'}}>assigned</span>
                </div>
                <p style={{ color: '#6b7280', marginBottom: '5px', fontSize: '14px' }}>Worker: {job.workers?.name}</p>
                <p style={{ color: '#6b7280', fontSize: '13px' }}>📅 {job.scheduled_date}</p>
              </div>
            ))}
            {pendingJobs.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px', gridColumn: '1 / -1' }}>No pending jobs</p>}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: '12px', padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>
              <div>Property</div>
              <div>Worker</div>
              <div>Scheduled Date</div>
            </div>
            {pendingJobs.filter(j => j.properties?.property_name.toLowerCase().includes(searchTerm.toLowerCase()) || j.workers?.name.toLowerCase().includes(searchTerm.toLowerCase())).map(job => (
              <div key={job.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: '12px', padding: '12px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', alignItems: 'center' }}>
                <div style={{ fontWeight: '600' }}>{job.properties?.property_name}</div>
                <div style={{ color: '#6b7280' }}>{job.workers?.name}</div>
                <div style={{ color: '#6b7280' }}>{job.scheduled_date}</div>
              </div>
            ))}
            {pendingJobs.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No pending jobs</p>}
          </div>
        )}
      </div>
    );
  };

  const TimeTrackingView = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Calculate worker time stats
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.actual_duration_minutes);

    // Total time per worker (all time)
    const workerTotalTime = workers.map(worker => {
      const workerJobs = completedJobs.filter(j => j.worker_id === worker.id);
      const totalMinutes = workerJobs.reduce((sum, j) => sum + (j.actual_duration_minutes || 0), 0);
      return { worker, totalMinutes, jobCount: workerJobs.length };
    }).filter(w => w.totalMinutes > 0);

    // Daily time per worker
    const workerDailyTime = workers.map(worker => {
      const workerJobs = completedJobs.filter(j =>
        j.worker_id === worker.id &&
        j.scheduled_date === selectedDate
      );
      const totalMinutes = workerJobs.reduce((sum, j) => sum + (j.actual_duration_minutes || 0), 0);
      return { worker, totalMinutes, jobCount: workerJobs.length, jobs: workerJobs };
    }).filter(w => w.totalMinutes > 0);

    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };

    return (
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>⏱️ Time Tracking</h2>

        {/* Date selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: '600', marginRight: '10px' }}>Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
        </div>

        {/* Daily tracking */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            Daily Time - {new Date(selectedDate).toLocaleDateString()}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {workerDailyTime.map(({ worker, totalMinutes, jobCount, jobs }) => (
              <div key={worker.id} style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600' }}>{worker.name}</h4>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
                    {formatTime(totalMinutes)}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>{jobCount} jobs completed</p>
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#2563eb' }}>View jobs</summary>
                  <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #e5e7eb' }}>
                    {jobs.map(job => (
                      <div key={job.id} style={{ fontSize: '12px', padding: '4px 0' }}>
                        <span style={{ fontWeight: '500' }}>{job.properties?.property_name}</span>
                        <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                          {formatTime(job.actual_duration_minutes)}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
            {workerDailyTime.length === 0 && (
              <p style={{ color: '#6b7280', padding: '20px' }}>No completed jobs for this date</p>
            )}
          </div>
        </div>

        {/* Total time (all time) */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Total Time (All Time)</h3>
          <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Worker</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Jobs</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Total Time</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Avg/Job</th>
                </tr>
              </thead>
              <tbody>
                {workerTotalTime.map(({ worker, totalMinutes, jobCount }) => (
                  <tr key={worker.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>{worker.name}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{jobCount}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#2563eb' }}>
                      {formatTime(totalMinutes)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>
                      {formatTime(Math.round(totalMinutes / jobCount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {workerTotalTime.length === 0 && (
              <p style={{ color: '#6b7280', padding: '20px', textAlign: 'center' }}>No completed jobs yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ReportedIssuesView = () => {
    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>⚠️ Reported Issues</h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => loadIssues()}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
          >
            🔄 Refresh
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
          {issues.map(issue => (
            <div key={issue.id} style={{ background: issue.resolved ? '#f9fafb' : '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: issue.resolved ? '1px solid #e5e7eb' : '2px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: issue.resolved ? '#d1fae5' : '#fef3c7', color: issue.resolved ? '#065f46' : '#92400e' }}>
                  {issue.resolved ? '✓ Resolved' : '⚠️ Active'}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(issue.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>
                  {issue.jobs?.properties?.property_name}
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                  📍 {issue.jobs?.properties?.address}
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                  👷 Worker: {issue.jobs?.profiles?.full_name}
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  📅 Job Date: {issue.jobs?.scheduled_date}
                </p>
              </div>

              <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Issue Type: <span style={{ textTransform: 'capitalize', color: '#f59e0b' }}>{issue.issue_type}</span>
                </p>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                  {issue.description}
                </p>
              </div>

              {!issue.resolved && (
                <button
                  onClick={() => markIssueResolved(issue.id)}
                  style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                >
                  ✓ Mark as Resolved
                </button>
              )}
            </div>
          ))}
          {issues.length === 0 && (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px', gridColumn: '1 / -1' }}>
              No issues reported yet
            </p>
          )}
        </div>
      </div>
    );
  };

  const SearchableDropdown = ({ options, value, onChange, placeholder, displayKey = 'name' }) => {
    const [dropdownSearch, setDropdownSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);
    
    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const filtered = options.filter(opt => 
      opt[displayKey].toLowerCase().includes(dropdownSearch.toLowerCase())
    );
    
    const selected = options.find(opt => opt.id === value);
    
    return (
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <div onClick={() => setIsOpen(!isOpen)} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px', cursor: 'pointer', background: 'white' }}>
          {selected ? selected[displayKey] : placeholder}
        </div>
        {isOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflow: 'auto', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <input
              type="text"
              placeholder="Search..."
              value={dropdownSearch}
              onChange={(e) => setDropdownSearch(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '8px', border: 'none', borderBottom: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' }}
            />
            {filtered.map(opt => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                  setDropdownSearch('');
                }}
                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: value === opt.id ? '#eff6ff' : 'white' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.background = value === opt.id ? '#eff6ff' : 'white'}
              >
                {opt[displayKey]}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '10px', color: '#6b7280', textAlign: 'center' }}>No results found</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ background: 'linear-gradient(to right, #2563eb, #1e40af)', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxHeight: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Golden Angel Snow Removal</h1>
            <p style={{ color: '#bfdbfe', marginTop: '2px', fontSize: '12px', margin: 0 }}>Admin Dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }} data-notification-panel>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', position: 'relative' }}
              >
                🔔
                {completionNotifications.length > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#10b981', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold', minWidth: '18px', textAlign: 'center' }}>
                    {completionNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '360px', maxHeight: '400px', overflowY: 'auto', zIndex: 100 }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>🎉 Completions</h3>
                    {completionNotifications.length > 0 && (
                      <button
                        onClick={() => setCompletionNotifications([])}
                        style={{ padding: '4px 8px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {completionNotifications.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>No completion notifications</p>
                    </div>
                  ) : (
                    <div>
                      {completionNotifications.map((notif, index) => (
                        <div key={notif.id} style={{ padding: '16px', borderBottom: index < completionNotifications.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                ✅ {notif.workerName}
                              </p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                                Completed all {notif.totalJobs} jobs
                              </p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                                {notif.date} • {new Date(notif.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <button
                              onClick={() => setCompletionNotifications(prev => prev.filter(n => n.id !== notif.id))}
                              style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px' }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to logout?')) {
                  localStorage.removeItem('adminAuth');
                  window.location.reload();
                }
              }}
              style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <div style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '24px', overflowX: 'auto' }}>
          {['dashboard', 'workers', 'clients', 'properties', 'jobs', 'today', 'completed', 'pending', 'tracking'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }} style={{padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '500', textTransform: 'capitalize', borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === tab ? '#2563eb' : '#6b7280', transition: 'all 0.2s', whiteSpace: 'nowrap'}}>{tab === 'tracking' ? 'Time Tracking' : tab}</button>
          ))}
          <button onClick={() => { setActiveTab('issues'); setSearchTerm(''); }} style={{padding: '16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '500', textTransform: 'capitalize', borderBottom: activeTab === 'issues' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'issues' ? '#2563eb' : '#6b7280', transition: 'all 0.2s', whiteSpace: 'nowrap', position: 'relative'}}>
            Issues
            {issues.filter(i => !i.resolved).length > 0 && (
              <span style={{ position: 'absolute', top: '8px', right: '4px', background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold', minWidth: '18px', textAlign: 'center' }}>
                {issues.filter(i => !i.resolved).length}
              </span>
            )}
          </button>
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'workers' && <WorkersView />}
            {activeTab === 'clients' && <ClientsView />}
            {activeTab === 'properties' && <PropertiesView />}
            {activeTab === 'jobs' && <JobsView />}
            {activeTab === 'today' && <TodayJobsView />}
            {activeTab === 'completed' && <CompletedJobsView />}
            {activeTab === 'pending' && <PendingJobsView />}
            {activeTab === 'tracking' && <TimeTrackingView />}
            {activeTab === 'issues' && <ReportedIssuesView />}
          </>
        )}
      </div>

      {/* Worker Modal */}
      {showWorkerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>{editingItem ? 'Edit Worker' : 'Add New Worker'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" placeholder="Full Name *" value={workerForm.name} onChange={(e) => setWorkerForm({...workerForm, name: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }} />
              <input type="email" placeholder="Email *" value={workerForm.email} onChange={(e) => setWorkerForm({...workerForm, email: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }} />
              <input type="tel" placeholder="Phone Number" value={workerForm.phone} onChange={(e) => setWorkerForm({...workerForm, phone: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }} />
              {!editingItem && (
                <>
                  <input type="password" placeholder="Password * (min. 6 characters)" value={workerForm.password} onChange={(e) => setWorkerForm({...workerForm, password: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }} />
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0', padding: '0 4px' }}>⚠️ Save this password - you'll need to share it with the worker</p>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={addOrUpdateWorker} style={{ flex: 1, background: '#2563eb', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>{editingItem ? 'Update' : 'Add'} Worker</button>
              <button onClick={() => { setShowWorkerModal(false); setEditingItem(null); setWorkerForm({ name: '', email: '', phone: '', password: '' }); }} style={{ flex: 1, background: '#d1d5db', color: '#374151', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Client Modal */}
      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>{editingItem ? 'Edit Client' : 'Add New Client'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" placeholder="Client Name *" value={clientForm.name} onChange={(e) => setClientForm({...clientForm, name: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }} />
              <input type="email" placeholder="Email" value={clientForm.email} onChange={(e) => setClientForm({...clientForm, email: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }} />
              <input type="tel" placeholder="Phone Number" value={clientForm.phone} onChange={(e) => setClientForm({...clientForm, phone: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={addOrUpdateClient} style={{ flex: 1, background: '#16a34a', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>{editingItem ? 'Update' : 'Add'} Client</button>
              <button onClick={() => { setShowClientModal(false); setEditingItem(null); setClientForm({ name: '', email: '', phone: '' }); }} style={{ flex: 1, background: '#d1d5db', color: '#374151', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Client Import Modal */}
      {showBulkClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Bulk Import Clients</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Enter one client per line. Format: Name, Email, Phone (separated by commas or tabs)
              <br />
              <span style={{ fontSize: '12px', fontStyle: 'italic' }}>Example: John Doe, john@email.com, 123-456-7890</span>
            </p>
            <textarea
              placeholder="John Doe, john@email.com, 123-456-7890&#10;Jane Smith, jane@email.com, 987-654-3210"
              value={bulkClientText}
              onChange={(e) => setBulkClientText(e.target.value)}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '14px', minHeight: '200px', fontFamily: 'monospace' }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={bulkImportClients} style={{ flex: 1, background: '#0891b2', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>
                Import Clients
              </button>
              <button onClick={() => { setShowBulkClientModal(false); setBulkClientText(''); }} style={{ flex: 1, background: '#d1d5db', color: '#374151', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Report Modal */}
      {showClientReportModal && clientReportData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '15px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '35px', maxWidth: '1200px', width: '100%', maxHeight: '95vh', overflow: 'auto' }}>
            <div id="printable-report" style={{ lineHeight: '1.2' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#0891b2', textAlign: 'center', lineHeight: '1.2' }}>Golden Angel Snow Removal - Service Completion Report</h3>

              {clientReportData.photos.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#374151', lineHeight: '1.2' }}>Service Photos ({clientReportData.photos.length})</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {(() => {
                      const sortedPhotos = [...clientReportData.photos].sort((a, b) => {
                        if (a.photo_type.toLowerCase().includes('after')) return -1;
                        if (b.photo_type.toLowerCase().includes('after')) return 1;
                        return 0;
                      });
                      return sortedPhotos.slice(0, 9).map((photo, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <img src={photo.photo_url} alt={photo.photo_type} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '6px' }} />
                          <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '3px' }}>{photo.photo_type}</span>
                        </div>
                      ));
                    })()}
                  </div>
                  {clientReportData.photos.length > 9 && (
                    <p style={{ fontSize: '11px', color: '#92400e', marginTop: '4px', textAlign: 'center', lineHeight: '1.2' }}>+ {clientReportData.photos.length - 9} more photos available</p>
                  )}
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                <p style={{ marginBottom: '0px', fontSize: '13px', lineHeight: '1.2' }}><strong>✓ Completed:</strong> {clientReportData.completedDate}</p>
                <p style={{ marginBottom: '0px', fontSize: '13px', lineHeight: '1.2' }}><strong>Notes:</strong> {clientReportData.notes}</p>
                <p style={{ marginBottom: '0px', fontSize: '13px', lineHeight: '1.2', marginTop: '3px' }}><strong>Client:</strong> {clientReportData.clientName}</p>
                <p style={{ marginBottom: '0px', fontSize: '13px', lineHeight: '1.2' }}><strong>Property:</strong> {clientReportData.propertyName}</p>
                <p style={{ marginBottom: '0px', fontSize: '13px', lineHeight: '1.2' }}><strong>Address:</strong> {clientReportData.propertyAddress}</p>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '2px solid #e5e7eb', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', marginBottom: '4px', lineHeight: '1.2' }}>Thank you for choosing Golden Angel Snow Removal!</p>
                <p style={{ fontSize: '13px', color: '#374151', marginTop: '4px', lineHeight: '1.2' }}>⭐ Leave us a Google Review</p>
                <p style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px', wordBreak: 'break-all', lineHeight: '1.2' }}>https://g.page/r/CWZ0JZAAwLz3EBM/review</p>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px', lineHeight: '1.2' }}>Report generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }} className="no-print">
              <button
                onClick={sendPDFToClient}
                style={{ flex: 1, background: '#10b981', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                📧 Send PDF to Client
              </button>
              <button
                onClick={() => generatePDF(true)}
                style={{ flex: 1, background: '#2563eb', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => setShowClientReportModal(false)}
                style={{ flex: 1, background: '#d1d5db', color: '#374151', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '15px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          #printable-report, #printable-report * {
            visibility: visible;
          }

          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            transform: scale(0.75);
            transform-origin: top left;
            page-break-after: avoid;
            page-break-inside: avoid;
          }

          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          #printable-report img {
            max-width: 100%;
            page-break-inside: avoid;
            page-break-before: avoid;
            page-break-after: avoid;
          }

          #printable-report > * {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Property Modal */}
      {showPropertyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflow: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', margin: '20px', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>{editingItem ? 'Edit Property' : 'Add New Property'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SearchableDropdown
                options={clients}
                value={propertyForm.client_id}
                onChange={(id) => setPropertyForm({...propertyForm, client_id: id})}
                placeholder="Select Client *"
                displayKey="name"
              />
              <input type="text" placeholder="Property Name (Optional)" value={propertyForm.property_name} onChange={(e) => setPropertyForm({...propertyForm, property_name: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }} />

              <div>
                <input type="text" placeholder="Full Address *" value={propertyForm.address} onChange={(e) => setPropertyForm({...propertyForm, address: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px', width: '100%' }} />
                <button
                  type="button"
                  onClick={() => geocodeAddress(propertyForm.address)}
                  style={{ marginTop: '8px', padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📍 Auto-Fill Coordinates from Address
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder="Latitude (auto-filled)" value={propertyForm.latitude} onChange={(e) => setPropertyForm({...propertyForm, latitude: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px', background: propertyForm.latitude ? '#f0fdf4' : 'white' }} />
                <input type="text" placeholder="Longitude (auto-filled)" value={propertyForm.longitude} onChange={(e) => setPropertyForm({...propertyForm, longitude: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px', background: propertyForm.longitude ? '#f0fdf4' : 'white' }} />
              </div>
              
              <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '20px' }}>
                <input type="file" accept="image/*" onChange={uploadPropertyPhoto} id="photo-upload" style={{ display: 'none' }} multiple />
                <label htmlFor="photo-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Upload size={32} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Click to upload property photos (multiple allowed)</span>
                </label>
                {propertyForm.highlight_photos.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {propertyForm.highlight_photos.map((photo, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img src={photo} alt="Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                        <button onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: '5px', right: '5px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <textarea placeholder="Special Notes" value={propertyForm.special_notes} onChange={(e) => setPropertyForm({...propertyForm, special_notes: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px', minHeight: '80px' }} />
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: '600' }}>Services Checklist * (select at least one)</label>
                  <button
                    onClick={() => setShowTemplateEditor(true)}
                    style={{ padding: '6px 12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit size={14} /> Edit Templates
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {checklistTemplates.map(item => (
                    <button key={item} onClick={() => toggleChecklistItem(item)} style={{padding: '8px 16px', borderRadius: '20px', border: selectedChecklistItems.includes(item) ? '2px solid #2563eb' : '2px solid #d1d5db', background: selectedChecklistItems.includes(item) ? '#dbeafe' : 'white', color: selectedChecklistItems.includes(item) ? '#1e40af' : '#6b7280', cursor: 'pointer', fontSize: '14px', fontWeight: '500'}}>{item}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Add custom service" value={customChecklistItem} onChange={(e) => setCustomChecklistItem(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addCustomChecklistItem()} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', fontSize: '14px' }} />
                  <button onClick={addCustomChecklistItem} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>+ Add</button>
                </div>
                {selectedChecklistItems.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Selected services ({selectedChecklistItems.length}):</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedChecklistItems.map(item => (
                        <span key={item} style={{ padding: '4px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item}
                          <X size={14} onClick={() => toggleChecklistItem(item)} style={{ cursor: 'pointer' }} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={addOrUpdateProperty} style={{ flex: 1, background: '#9333ea', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>{editingItem ? 'Update' : 'Add'} Property</button>
              <button onClick={() => { setShowPropertyModal(false); setEditingItem(null); setSelectedChecklistItems([]); setPropertyForm({ client_id: '', property_name: '', address: '', latitude: '', longitude: '', highlight_photos: [], special_notes: '', checklist: [] }); }} style={{ flex: 1, background: '#d1d5db', color: '#374151', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Job Modal */}
      {showJobModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflow: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', margin: '20px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>Assign Job{bulkMode ? 's' : ''}</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={bulkMode}
                  onChange={(e) => {
                    setBulkMode(e.target.checked);
                    setSelectedProperties([]);
                    setJobForm({...jobForm, property_id: ''});
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Bulk Mode</span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SearchableDropdown
                options={workers}
                value={jobForm.worker_id}
                onChange={(id) => setJobForm({...jobForm, worker_id: id})}
                placeholder="Select Worker *"
                displayKey="name"
              />

              {!bulkMode ? (
                <SearchableDropdown
                  options={properties.map(p => ({ ...p, name: `${p.property_name} - ${p.address}` }))}
                  value={jobForm.property_id}
                  onChange={(id) => setJobForm({...jobForm, property_id: id})}
                  placeholder="Select Property *"
                  displayKey="name"
                />
              ) : (
                <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', maxHeight: '200px', overflow: 'auto' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Select Properties ({selectedProperties.length} selected)</p>
                  {properties.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '6px', background: selectedProperties.includes(p.id) ? '#eff6ff' : 'transparent' }}>
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProperties([...selectedProperties, p.id]);
                          } else {
                            setSelectedProperties(selectedProperties.filter(id => id !== p.id));
                          }
                        }}
                      />
                      <span style={{ fontSize: '14px' }}>{p.property_name} - {p.address}</span>
                    </label>
                  ))}
                </div>
              )}

              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Start Date *</label>
                <input type="date" value={jobForm.scheduled_date} onChange={(e) => setJobForm({...jobForm, scheduled_date: e.target.value})} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }} />
              </div>

              <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', background: '#f9fafb' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>Assignment Type</label>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={jobForm.assignment_type === 'one-time'}
                      onChange={() => setJobForm({...jobForm, assignment_type: 'one-time'})}
                    />
                    <span style={{ fontSize: '16px' }}>One-time</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={jobForm.assignment_type === 'recurring'}
                      onChange={() => setJobForm({...jobForm, assignment_type: 'recurring'})}
                    />
                    <span style={{ fontSize: '16px' }}>Recurring (Period)</span>
                  </label>
                </div>

                {jobForm.assignment_type === 'recurring' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #d1d5db' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Frequency</label>
                      <select
                        value={jobForm.frequency}
                        onChange={(e) => setJobForm({...jobForm, frequency: e.target.value})}
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px', background: 'white' }}
                      >
                        <option value="daily">Daily (every day)</option>
                        <option value="weekly">Weekly (every 7 days)</option>
                        <option value="bi-weekly">Bi-weekly (every 14 days)</option>
                        <option value="monthly">Monthly (every 30 days)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>End Date</label>
                      <input
                        type="date"
                        value={jobForm.end_date}
                        onChange={(e) => setJobForm({...jobForm, end_date: e.target.value})}
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }}
                      />
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', background: '#eff6ff', padding: '10px', borderRadius: '6px' }}>
                      💡 Jobs will be created from <strong>{jobForm.scheduled_date}</strong> to <strong>{jobForm.end_date}</strong> at <strong>{jobForm.frequency}</strong> intervals
                    </div>
                  </div>
                )}
              </div>

              {/* VIP Priority Section */}
              <div style={{ border: '2px solid #dc2626', borderRadius: '8px', padding: '16px', background: jobForm.is_vip ? '#fef2f2' : '#f9fafb' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '12px' }}>
                  <input
                    type="checkbox"
                    checked={jobForm.is_vip}
                    onChange={(e) => setJobForm({...jobForm, is_vip: e.target.checked})}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: jobForm.is_vip ? '#dc2626' : '#374151' }}>
                      ⭐ VIP / High Priority Job
                    </span>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                      Must be completed before deadline. Will appear first in worker's list and map.
                    </p>
                  </div>
                </label>

                {jobForm.is_vip && (
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block', color: '#dc2626' }}>
                      Deadline Time (e.g., 9:30 AM)
                    </label>
                    <input
                      type="time"
                      value={jobForm.deadline_time}
                      onChange={(e) => setJobForm({...jobForm, deadline_time: e.target.value})}
                      style={{ width: '100%', border: '2px solid #dc2626', borderRadius: '8px', padding: '12px', fontSize: '16px' }}
                    />
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                      Job must be completed by this time
                    </p>
                  </div>
                )}
              </div>

              {/* Estimated Duration */}
              <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', background: '#f9fafb' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  ⏱️ Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={jobForm.estimated_duration_minutes}
                  onChange={(e) => setJobForm({...jobForm, estimated_duration_minutes: parseInt(e.target.value) || 60})}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '16px' }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                  How long should this job take? ({jobForm.estimated_duration_minutes >= 60 ? `${Math.floor(jobForm.estimated_duration_minutes / 60)}h ${jobForm.estimated_duration_minutes % 60}m` : `${jobForm.estimated_duration_minutes} minutes`})
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={async () => {
                if (!jobForm.worker_id) {
                  alert('Please select a worker');
                  return;
                }

                const propertiesToAssign = bulkMode ? selectedProperties : (jobForm.property_id ? [jobForm.property_id] : []);

                if (propertiesToAssign.length === 0) {
                  alert('Please select at least one property');
                  return;
                }

                // Generate dates based on assignment type
                const datesToSchedule = [];

                if (jobForm.assignment_type === 'one-time') {
                  datesToSchedule.push(jobForm.scheduled_date);
                } else {
                  // Recurring: generate all dates from start to end
                  const startDate = new Date(jobForm.scheduled_date);
                  const endDate = new Date(jobForm.end_date);

                  if (endDate <= startDate) {
                    alert('End date must be after start date');
                    return;
                  }

                  const intervalDays = jobForm.frequency === 'daily' ? 1 : jobForm.frequency === 'weekly' ? 7 : jobForm.frequency === 'bi-weekly' ? 14 : 30;
                  let currentDate = new Date(startDate);

                  while (currentDate <= endDate) {
                    datesToSchedule.push(currentDate.toISOString().split('T')[0]);
                    currentDate.setDate(currentDate.getDate() + intervalDays);
                  }
                }

                // Create jobs for each property and each date
                const jobsToInsert = [];
                const recurringGroupId = jobForm.assignment_type === 'recurring' ? crypto.randomUUID() : null;

                propertiesToAssign.forEach(property_id => {
                  datesToSchedule.forEach(scheduled_date => {
                    jobsToInsert.push({
                      property_id,
                      worker_id: jobForm.worker_id,
                      scheduled_date,
                      status: 'assigned',
                      recurring_group_id: recurringGroupId,
                      is_vip: jobForm.is_vip,
                      deadline_time: jobForm.is_vip ? jobForm.deadline_time : null,
                      published: jobForm.published,
                      estimated_duration_minutes: jobForm.estimated_duration_minutes
                    });
                  });
                });

                if (jobsToInsert.length > 100) {
                  if (!window.confirm(`This will create ${jobsToInsert.length} jobs. Continue?`)) {
                    return;
                  }
                }

                const { error } = await supabase.from('jobs').insert(jobsToInsert);

                if (!error) {
                  setShowJobModal(false);
                  setJobForm({
                    property_id: '',
                    worker_id: '',
                    scheduled_date: new Date().toISOString().split('T')[0],
                    assignment_type: 'one-time',
                    frequency: 'daily',
                    end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    is_vip: false,
                    deadline_time: '09:30',
                    published: true,
                    estimated_duration_minutes: 60
                  });
                  setSelectedProperties([]);
                  setBulkMode(false);
                  loadJobs();
                  alert(`${jobsToInsert.length} job(s) assigned successfully!${jobForm.assignment_type === 'recurring' ? ` (${datesToSchedule.length} dates × ${propertiesToAssign.length} properties)` : ''}`);
                } else {
                  alert('Error assigning jobs: ' + error.message);
                }
              }} style={{ flex: 1, background: '#ea580c', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>
                Assign {bulkMode && selectedProperties.length > 0 ? `${selectedProperties.length} ` : ''}Job{bulkMode && selectedProperties.length !== 1 ? 's' : ''}
              </button>
              <button onClick={() => {
                setShowJobModal(false);
                setJobForm({
                  property_id: '',
                  worker_id: '',
                  scheduled_date: new Date().toISOString().split('T')[0],
                  assignment_type: 'one-time',
                  frequency: 'daily',
                  end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  is_vip: false,
                  deadline_time: '09:30',
                  published: true,
                  estimated_duration_minutes: 60
                });
                setSelectedProperties([]);
                setBulkMode(false);
              }} style={{ flex: 1, background: '#d1d5db', color: '#374151', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {photoViewerOpen && selectedPhotos.length > 0 && (
        <div
          onClick={() => setPhotoViewerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '0', display: 'flex', gap: '8px' }}>
              <a
                href={selectedPhotos[currentPhotoIndex].photo_url}
                download={`${selectedPhotos[currentPhotoIndex].photo_type}-photo-${Date.now()}.jpg`}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                ⬇ Download
              </a>
              <button
                onClick={() => setPhotoViewerOpen(false)}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>

            <img
              src={selectedPhotos[currentPhotoIndex].photo_url}
              alt={selectedPhotos[currentPhotoIndex].photo_type}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }}
            />

            <div style={{ position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{selectedPhotos[currentPhotoIndex].photo_type}</span>
              <span>•</span>
              <span>{currentPhotoIndex + 1} / {selectedPhotos.length}</span>
            </div>

            {selectedPhotos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhotoIndex((currentPhotoIndex - 1 + selectedPhotos.length) % selectedPhotos.length)}
                  style={{ position: 'absolute', left: '-60px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex((currentPhotoIndex + 1) % selectedPhotos.length)}
                  style={{ position: 'absolute', right: '-60px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Edit Checklist Templates</h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Service Templates</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {checklistTemplates.map((template, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <span style={{ flex: 1, fontSize: '14px' }}>{template}</span>
                    <button
                      onClick={() => setChecklistTemplates(checklistTemplates.filter((_, i) => i !== index))}
                      style={{ padding: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Add new template"
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTemplate.trim()) {
                      setChecklistTemplates([...checklistTemplates, newTemplate.trim()]);
                      setNewTemplate('');
                    }
                  }}
                  style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '6px', padding: '10px', fontSize: '14px' }}
                />
                <button
                  onClick={() => {
                    if (newTemplate.trim()) {
                      setChecklistTemplates([...checklistTemplates, newTemplate.trim()]);
                      setNewTemplate('');
                    }
                  }}
                  style={{ padding: '10px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setChecklistTemplates(DEFAULT_CHECKLIST_TEMPLATES);
                  alert('Templates reset to defaults!');
                }}
                style={{ flex: 1, padding: '12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                Reset to Defaults
              </button>
              <button
                onClick={() => setShowTemplateEditor(false)}
                style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
};

// Main App component with authentication
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const authData = localStorage.getItem('adminAuth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.loggedIn) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        localStorage.removeItem('adminAuth');
      }
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default App;