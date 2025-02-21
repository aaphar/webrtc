import React, { useState } from "react";
import TextInput from "./TextInput";
import Button from "./Button";
import Dropdown from "./Dropdown";

const dropdownConfig = {
  name: "user",
  id: "userId",
  labelText: "Choose a user: ",
  dropdownValues: [
    {
      selectValue: "admin",
      displayText: "admin",
    },
    {
      selectValue: "superadmin",
      displayText: "superadmin",
    },
    {
      selectValue: "user",
      displayText: "user",
    },
    {
      selectValue: "Jane",
      displayText: "Jane",
    },
  ],
};

const UserSelection = ({ onUserContextSet }) => {
  const [username, setUserName] = useState(
    dropdownConfig.dropdownValues[0].displayText
  );

  return (
    <div>
      <Dropdown
        onSelect={(e) => setUserName(e.target.value)}
        selectedValue={username}
        {...dropdownConfig}
      />
      <Button
        displayText={"Submit!"}
        onClick={() => onUserContextSet({ username })}
      />
    </div>
  );
};

export default UserSelection;
