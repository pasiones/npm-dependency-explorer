import React from 'react';

const InfoList = ({ packageInfo }) => {
  if (!packageInfo) {
    return <div>No package selected</div>;
  }

  return (
    <div>
      <h4>Package Information</h4>
      <p><strong>Name:</strong> {packageInfo.name}</p>
      <p><strong>Size:</strong> {packageInfo.size} bytes</p>
      <p><strong>Gzip Size:</strong> {packageInfo.gzip} bytes</p>
      <p><strong>Version:</strong> {packageInfo.version}</p>
    </div>
  );
};

export default InfoList;