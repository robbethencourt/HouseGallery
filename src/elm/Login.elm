port module Login exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Json.Encode as JE
import Navigation


-- model


type alias Model =
    { email : String
    , password : String
    , error : Maybe String
    }


initModel : Model
initModel =
    { email = ""
    , password = ""
    , error = Nothing
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = EmailInput String
    | PasswordInput String
    | Submit
    | Error String
    | UserLoggedIn String


update : Msg -> Model -> ( Model, Cmd Msg, Maybe String )
update msg model =
    case msg of
        EmailInput email ->
            ( { model | email = email }, Cmd.none, Nothing )

        PasswordInput password ->
            ( { model | password = password }, Cmd.none, Nothing )

        Submit ->
            let
                body =
                    JE.object
                        [ ( "email", JE.string model.email )
                        , ( "password", JE.string model.password )
                        ]
                        |> JE.encode 4

                cmd =
                    fetchingUser body
            in
                ( model, cmd, Nothing )

        Error error ->
            ( { model | error = Just error }, Cmd.none, Nothing )

        UserLoggedIn key ->
            ( { model
                | email = ""
                , password = ""
              }
            , Navigation.newUrl "#/gallery"
            , Just key
            )



-- view


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ errorPanel model.error
        , loginForm model
        , p [] [ text (toString model) ]
        ]


loginForm : Model -> Html Msg
loginForm model =
    div [ class "row" ]
        [ div [ class "col-md-6 col-md-offset-3" ]
            [ h2 [] [ text "Login" ]
            , Html.form [ class "signup-login", onSubmit Submit ]
                [ label [] [ text "Email" ]
                , div [ class "form-group" ]
                    [ input
                        [ type_ "text"
                        , class "form-control"
                        , value model.email
                        , onInput EmailInput
                        ]
                        []
                    ]
                , label [] [ text "Password" ]
                , div [ class "form-group" ]
                    [ input
                        [ type_ "password"
                        , class "form-control"
                        , value model.password
                        , onInput PasswordInput
                        ]
                        []
                    ]
                , div [ class "form-group" ]
                    [ label [] []
                    , button
                        [ type_ "submit"
                        , class "btn btn-default"
                        ]
                        [ text "Login" ]
                    ]
                ]
            ]
        ]


errorPanel : Maybe String -> Html a
errorPanel error =
    case error of
        Nothing ->
            text ""

        Just msg ->
            div [ class "error" ]
                [ text msg ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ userLoggedIn UserLoggedIn ]



-- ports


port fetchingUser : String -> Cmd msg


port userLoggedIn : (String -> msg) -> Sub msg
