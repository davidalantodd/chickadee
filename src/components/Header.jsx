import chickadee from '../assets/chickadee.png'

function Header() {
    return (
        <header>
            <img className="chickadee-icon" src={chickadee}/>
            <h1 className="title">chickadee</h1>
        </header>
    )
}

export default Header