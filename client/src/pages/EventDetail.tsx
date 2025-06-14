import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';


interface EventDetailProps {
  isAuthenticated: boolean;
  user: any;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  club_name: string;
  club_id: number;
}

const EventDetail: React.FC<EventDetailProps> = ({ isAuthenticated, user }) => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');


  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const eventResponse = await axios.get(`http://localhost:5000/api/events/${id}`);
        setEvent(eventResponse.data);

        if (isAuthenticated && user) {
          const token = localStorage.getItem('token');
          const userEventsResponse = await axios.get('http://localhost:5000/api/users/me/events', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const registered = userEventsResponse.data.some((e: any) => e.id === parseInt(id as string));
          setIsRegistered(registered);


        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('Failed to load event details. Please try again later.');
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, isAuthenticated, user]);

  const handleRegisterForEvent = async () => {
    if (!isAuthenticated) {
      setError('Please log in to register for this event');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/events/${id}/register`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setIsRegistered(true);
      setSuccessMessage('You have successfully registered for this event!');
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to register for event. Please try again.');
    }
  };



  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <Container>
        <Alert variant="danger">Event not found</Alert>
        <Link to="/events">
          <Button variant="primary">Back to Events</Button>
        </Link>
      </Container>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString();
  const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>{event.title}</h1>
          <div className="mb-3">
            <Badge bg="primary" className="me-2">
              {formattedDate} at {formattedTime}
            </Badge>
            <Badge bg="secondary" className="me-2">
              {event.location}
            </Badge>
            <Badge bg="info">
              {event.club_name}
            </Badge>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <div className="mb-3">
            {isAuthenticated && !isRegistered ? (
              <Button
                variant="primary"
                onClick={handleRegisterForEvent}
              >
                Register for Event
              </Button>
            ) : isRegistered ? (
              <Alert variant="success" className="mb-0">
                You are registered for this event
              </Alert>
            ) : null}
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="mb-4">
            <Card.Header as="h5">Event Details</Card.Header>
            <Card.Body>
              <Card.Text>{event.description}</Card.Text>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5">Location</Card.Header>
            <Card.Body>
              <Card.Text>{event.location}</Card.Text>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5">Organized By</Card.Header>
            <Card.Body>
              <Card.Text>
                <Link to={`/clubs/${event.club_id}`}>{event.club_name}</Link>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mt-4">
        <Link to="/events">
          <Button variant="secondary">Back to Events</Button>
        </Link>
      </div>
    </Container>
  );
};

export default EventDetail;
