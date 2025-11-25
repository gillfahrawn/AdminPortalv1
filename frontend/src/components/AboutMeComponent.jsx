import { useState, useEffect } from 'react';

const AboutMeComponent = ({ value, onChange }) => {
  const [aboutMe, setAboutMe] = useState(value || '');

  useEffect(() => {
    setAboutMe(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setAboutMe(newValue);
    onChange('about_me', newValue);
  };

  return (
    <div className="form-group">
      <label htmlFor="about-me">
        <strong>About Me</strong>
      </label>
      <textarea
        id="about-me"
        value={aboutMe}
        onChange={handleChange}
        placeholder="Tell us about yourself..."
        rows={6}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          resize: 'vertical',
          fontFamily: 'inherit'
        }}
      />
    </div>
  );
};

export default AboutMeComponent;
