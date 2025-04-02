import React from 'react';

const InfoList = ({ packageInfo }) => {
  if (!packageInfo) {
    return <div>No package selected</div>;
  }

  return (
    <div>
      <h3>Package Information</h3>
      <p><strong>Name:</strong> {packageInfo.name}</p>
      <p><strong>Size:</strong> {packageInfo.size} bytes</p>
      <p><strong>Gzip Size:</strong> {packageInfo.gzip} bytes</p>
    </div>
  );
};

export default InfoList;