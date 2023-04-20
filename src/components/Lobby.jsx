import { useState } from "react";
export default function Lobby ({createConnection}) {

    const [user, setUser] = useState();

    return (
        <div className="lobby"> 
        <form action="POST" onSubmit={e => {
            e.preventDefault();
            createConnection(user);
        }}>
        <label htmlFor="username"> Enter a username that your teammates can recognize! c:</label>
        <br />
        <br />
        <input type="text" name="username" onChange={e => setUser(e.target.value)}/>
        <br />
        <button className="lobbyBtn" disabled={!user} type="submit">Join</button>
        </form>

        </div>
    )
}