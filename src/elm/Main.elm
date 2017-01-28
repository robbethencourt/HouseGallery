port module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Navigation
import Signup
import Gallery
import Login
import AddArtwork
import Artwork


-- model


type alias Model =
    { page : Page
    , signup : Signup.Model
    , gallery : Gallery.Model
    , login : Login.Model
    , addArtwork : AddArtwork.Model
    , artwork : Artwork.Model
    , token : Maybe String
    , userId : Maybe String
    , loggedIn : Bool
    }


type Page
    = NotFound
    | SignupPage
    | GalleryPage
    | LoginPage
    | AddArtworkPage
    | ArtworkPage


init : Flags -> Navigation.Location -> ( Model, Cmd Msg )
init flags location =
    let
        page =
            hashToPage location.hash

        ( signupInitModel, signupCmd ) =
            Signup.init

        ( galleryInitModel, galleryCmd ) =
            Gallery.init

        ( loginInitModel, loginCmd ) =
            Login.init

        ( addArtworkInitModel, addArtworkCmd ) =
            AddArtwork.init

        ( artworkInitModel, artworkCmd ) =
            Artwork.init

        initModel =
            { page = page
            , signup = signupInitModel
            , gallery = galleryInitModel
            , login = loginInitModel
            , addArtwork = addArtworkInitModel
            , artwork = artworkInitModel
            , token = flags.token
            , userId = Nothing
            , loggedIn = flags.token /= Nothing
            }

        cmds =
            Cmd.batch
                [ Cmd.map SignupMsg signupCmd
                , Cmd.map GalleryMsg galleryCmd
                , Cmd.map LoginMsg loginCmd
                , Cmd.map AddArtworkMsg addArtworkCmd
                , Cmd.map ArtworkMsg artworkCmd
                ]
    in
        ( initModel, cmds )



-- update


type Msg
    = Navigate Page
    | ChangePage Page
    | SignupMsg Signup.Msg
    | GalleryMsg Gallery.Msg
    | LoginMsg Login.Msg
    | AddArtworkMsg AddArtwork.Msg
    | ArtworkMsg Artwork.Msg
    | SaveToken (Maybe String)


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Navigate page ->
            ( { model | page = page }, Navigation.newUrl <| pageToHash page )

        ChangePage page ->
            ( { model | page = page }, Cmd.none )

        SignupMsg msg ->
            let
                ( signupModel, cmd, userId ) =
                    Signup.update msg model.signup

                loggedIn =
                    userId /= Nothing

                saveUserIdCmd =
                    case userId of
                        Just key ->
                            saveUserId key

                        Nothing ->
                            Cmd.none
            in
                ( { model | signup = signupModel }
                , Cmd.batch
                    [ Cmd.map SignupMsg cmd
                    , saveUserIdCmd
                    ]
                )

        GalleryMsg msg ->
            let
                ( galleryModel, cmd ) =
                    Gallery.update msg model.gallery
            in
                ( { model | gallery = galleryModel }
                , Cmd.map GalleryMsg cmd
                )

        LoginMsg msg ->
            let
                ( loginModel, cmd, userId ) =
                    Login.update msg model.login

                loggedIn =
                    userId /= Nothing

                saveUserIdCmd =
                    case userId of
                        Just key ->
                            saveUserId key

                        Nothing ->
                            Cmd.none
            in
                ( { model
                    | login = loginModel
                    , userId = userId
                    , loggedIn = loggedIn
                  }
                , Cmd.batch
                    [ Cmd.map LoginMsg cmd
                    , saveUserIdCmd
                    ]
                )

        AddArtworkMsg msg ->
            let
                ( addArtworkModel, cmd ) =
                    AddArtwork.update msg model.addArtwork
            in
                ( { model | addArtwork = addArtworkModel }
                , Cmd.map AddArtworkMsg cmd
                )

        ArtworkMsg msg ->
            let
                ( artworkModel, cmd ) =
                    Artwork.update msg model.artwork
            in
                ( { model | artwork = artworkModel }
                , Cmd.map ArtworkMsg cmd
                )

        SaveToken token ->
            ( { model | token = token }
            , Navigation.newUrl "#/gallery"
            )



-- view


view : Model -> Html Msg
view model =
    let
        page =
            case model.page of
                SignupPage ->
                    Html.map SignupMsg
                        (Signup.view model.signup)

                GalleryPage ->
                    Html.map GalleryMsg
                        (Gallery.view model.gallery)

                LoginPage ->
                    Html.map LoginMsg
                        (Login.view model.login)

                AddArtworkPage ->
                    Html.map AddArtworkMsg
                        (AddArtwork.view model.addArtwork)

                ArtworkPage ->
                    Html.map ArtworkMsg
                        (Artwork.view model.artwork)

                NotFound ->
                    div [ class "main" ]
                        [ h1 []
                            [ text "Page Not Found!" ]
                        ]
    in
        div [ class "container-fluid" ]
            [ pageHeader model
            , page
            ]


pageHeader : Model -> Html Msg
pageHeader model =
    header []
        [ nav [ class "navbar" ]
            [ ul [ class "nav navbar-nav navbar-left" ]
                [ li []
                    [ a [ href "#/" ] [ text "Home" ] ]
                , li []
                    [ a [ onClick (Navigate GalleryPage) ] [ text "Gallery" ] ]
                , li []
                    [ a [ onClick (Navigate AddArtworkPage) ] [ text "Add Artwork" ] ]
                ]
            , ul [ class "nav navbar-nav navbar-right" ]
                [ li []
                    [ a [ onClick (Navigate LoginPage) ] [ text "Login" ] ]
                , li []
                    [ a [ onClick (Navigate SignupPage) ] [ text "Signup" ] ]
                ]
            ]
        ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    let
        signupSub =
            Signup.subscriptions model.signup

        gallerySub =
            Gallery.subscriptions model.gallery

        loginSub =
            Login.subscriptions model.login

        addArtworkSub =
            AddArtwork.subscriptions model.addArtwork

        artworkSub =
            Artwork.subscriptions model.artwork
    in
        Sub.batch
            [ Sub.map SignupMsg signupSub
            , Sub.map GalleryMsg gallerySub
            , Sub.map LoginMsg loginSub
            , Sub.map AddArtworkMsg addArtworkSub
            , Sub.map ArtworkMsg artworkSub
            ]


hashToPage : String -> Page
hashToPage hash =
    case hash of
        "#/" ->
            SignupPage

        "" ->
            SignupPage

        "#/signup" ->
            SignupPage

        "#/gallery" ->
            GalleryPage

        "#/login" ->
            LoginPage

        "#/addArtwork" ->
            AddArtworkPage

        "#/artwork" ->
            ArtworkPage

        _ ->
            NotFound


pageToHash : Page -> String
pageToHash page =
    case page of
        SignupPage ->
            "#/signup"

        GalleryPage ->
            "#/gallery"

        LoginPage ->
            "#/login"

        AddArtworkPage ->
            "#/addArtwork"

        ArtworkPage ->
            "#/artwork"

        NotFound ->
            "#notFound"



-- main


locationToMsg : Navigation.Location -> Msg
locationToMsg location =
    location.hash
        |> hashToPage
        |> ChangePage


type alias Flags =
    { token : Maybe String }


main : Program Flags Model Msg
main =
    Navigation.programWithFlags locationToMsg
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }


port saveUserId : String -> Cmd msg


port saveToken : String -> Cmd msg
