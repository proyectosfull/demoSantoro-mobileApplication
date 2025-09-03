export default class TrustValueApiUrls {
    //static readonly BASEURL = 'https://trustvalue.dev.darpinnova.com/api/';
    static readonly BASEURL = 'http://187.188.66.56:8025/api/'; // Servidor prueba de santoro ** 8025
    //static readonly BASEURL = 'http://192.168.100.30:8081/api/'; // Servidor local Alan 

    static readonly LOGIN = TrustValueApiUrls.BASEURL + 'login';
    static readonly LOGOUT = TrustValueApiUrls.BASEURL + 'logout';
    static readonly BRANCH_OFFICES_BY_GEOLOCATION = TrustValueApiUrls.BASEURL + 'branch-offices-by-geolocation'; 
    static readonly BRANCH_OFFICES_BY_REGION = TrustValueApiUrls.BASEURL + 'branch-offices'; 
    static readonly CHECKASIST = TrustValueApiUrls.BASEURL + 'laboral-attendances';
    static readonly ENDDAY = TrustValueApiUrls.BASEURL + 'laboral-attendances/';
    static readonly SENDEVIDENCE = TrustValueApiUrls.BASEURL + 'evidences';
    static readonly GETANNOUNCEMENTS = TrustValueApiUrls.BASEURL + 'announcements';
    static readonly GETPRODUCTS = TrustValueApiUrls.BASEURL + 'products';
    static readonly GETSURVEYS = TrustValueApiUrls.BASEURL + 'surveys'; 
    static readonly ANSWERSURVEY = TrustValueApiUrls.BASEURL + 'survey-answers';
    static readonly GETEVALUATIONS = TrustValueApiUrls.BASEURL + 'evaluations';
    static readonly ANSWEREVALUATION = TrustValueApiUrls.BASEURL + 'evaluation-answers';
    static readonly LABORALABSENCES = TrustValueApiUrls.BASEURL + 'laboral-absences';
    static readonly EDITIMAGEPROFILE = TrustValueApiUrls.BASEURL + 'users/'
    static readonly GETSIMULATOR = TrustValueApiUrls.BASEURL + 'simulators' 
}
