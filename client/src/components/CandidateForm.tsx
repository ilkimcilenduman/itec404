import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { addElectionCandidate } from '../services/electionApi';
import axios from 'axios';

interface CandidateFormProps {
  electionId: number;
  clubId: number;
  onCandidateAdded?: () => void;
  onCancel?: () => void;
}

interface ClubMember {
  user_id: number;
  name: string;
  email: string;
  student_id: string;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ 
  electionId, 
  clubId, 
  onCandidateAdded, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    user_id: '',
    position: '',
    statement: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const fetchClubMembers = async () => {
      try {
        setLoadingMembers(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`http://localhost:5000/api/clubs/${clubId}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const approvedMembers = response.data.filter((member: any) => member.status === 'approved');
        setClubMembers(approvedMembers);
        
        setLoadingMembers(false);
      } catch (error) {
        console.error('Error fetching club members:', error);
        setLoadingMembers(false);
      }
    };

    fetchClubMembers();
  }, [clubId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.user_id || !formData.position) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      await addElectionCandidate(electionId, {
        ...formData,
        user_id: parseInt(formData.user_id)
      });
      
      setSuccess('Candidate added successfully');
      setFormData({
        user_id: '',
        position: '',
        statement: ''
      });
      
      if (onCandidateAdded) {
        onCandidateAdded();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add candidate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingMembers) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading club members...</p>
      </div>
    );
  }

  if (clubMembers.length === 0) {
    return (
      <Alert variant="warning">
        This club has no members. Members must join the club before they can be added as candidates.
      </Alert>
    );
  }

  return (
    <div className="candidate-form">
      <h3 className="mb-3">Add Candidate</h3>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Member*</Form.Label>
          <Form.Select
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            required
          >
            <option value="">Select a member</option>
            {clubMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.name} ({member.student_id})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Position*</Form.Label>
          <Form.Control
            type="text"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="e.g., President, Treasurer, Secretary"
            required
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Statement</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="statement"
            value={formData.statement}
            onChange={handleChange}
            placeholder="Candidate's statement or platform"
          />
        </Form.Group>
        
        <div className="d-flex justify-content-end gap-2">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Adding...
              </>
            ) : (
              'Add Candidate'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CandidateForm;
