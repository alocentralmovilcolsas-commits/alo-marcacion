// =====================================================================
//  ALO CENTRAL MOVIL - Backend v13
//  Cambios: 42h semana, contratos, empleados retirados, horarios edit
// =====================================================================

var SHEET_ID = '1Hl7pP4HreFj91_dCDRMQaGvP2octaZIzVQTC5qWEmNM';
var TZ       = 'America/Bogota';
var FESTIVOS = [
  // 2025
  '01/01/2025','06/01/2025','24/03/2025','17/04/2025','18/04/2025',
  '01/05/2025','02/06/2025','23/06/2025','30/06/2025','20/07/2025',
  '07/08/2025','18/08/2025','13/10/2025','03/11/2025','17/11/2025',
  '08/12/2025','25/12/2025',
  // 2026
  '01/01/2026','12/01/2026','23/03/2026','02/04/2026','03/04/2026',
  '01/05/2026','18/05/2026','08/06/2026','29/06/2026','20/07/2026',
  '07/08/2026','17/08/2026','12/10/2026','02/11/2026','16/11/2026',
  '08/12/2026','25/12/2026',
  // 2027
  '01/01/2027','11/01/2027','25/03/2027','25/03/2027','26/03/2027',
  '01/05/2027','07/06/2027','28/06/2027','05/07/2027','20/07/2027',
  '07/08/2027','16/08/2027','18/10/2027','01/11/2027','15/11/2027',
  '08/12/2027','25/12/2027',
  // 2028
  '01/01/2028','10/01/2028','13/03/2028','13/04/2028','14/04/2028',
  '01/05/2028','29/05/2028','19/06/2028','26/06/2028','20/07/2028',
  '07/08/2028','21/08/2028','16/10/2028','06/11/2028','20/11/2028',
  '08/12/2028','25/12/2028',
  // 2029
  '01/01/2029','08/01/2029','19/03/2029','18/04/2029','19/04/2029',
  '01/05/2029','04/06/2029','25/06/2029','02/07/2029','20/07/2029',
  '07/08/2029','20/08/2029','15/10/2029','05/11/2029','19/11/2029',
  '08/12/2029','25/12/2029',
  // 2030
  '01/01/2030','07/01/2030','01/04/2030','18/04/2030','19/04/2030',
  '01/05/2030','03/06/2030','24/06/2030','01/07/2030','20/07/2030',
  '07/08/2030','19/08/2030','14/10/2030','04/11/2030','18/11/2030',
  '08/12/2030','25/12/2030'
];

// Limite semanal: 42h (Ley 2466/2025 desde jul 2026)
function getLimiteHorasSemanales() { return 42; }

function getLunesDeSemana(fechaStr) {
  var p=fechaStr.split('/');
  var d=new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));
  var dow=d.getDay();
  var diff=(dow===0)?-6:1-dow;
  d.setDate(d.getDate()+diff);
  return Utilities.formatDate(d,TZ,'dd/MM/yyyy');
}

function getSemanaDelMes(fechaStr) {
  var p=fechaStr.split('/');
  return Math.ceil(parseInt(p[0])/7);
}

function parseFecha(str) {
  var p=str.split('/');
  return new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));
}

function toFechaStr(val) {
  if(!val) return '';
  if(val instanceof Date) return Utilities.formatDate(val,TZ,'dd/MM/yyyy');
  var s=String(val).trim();
  if(s.indexOf('GMT')!==-1){try{return Utilities.formatDate(new Date(s),TZ,'dd/MM/yyyy');}catch(e){}}
  return s;
}

function toHoraStr(val) {
  if(!val) return '';
  if(val instanceof Date) return Utilities.formatDate(val,TZ,'HH:mm');
  var s=String(val).trim();
  if(s.indexOf('GMT')!==-1||s.indexOf('1899')!==-1){try{return Utilities.formatDate(new Date(s),TZ,'HH:mm');}catch(e){}}
  return s;
}

function getHorasDecimal(val) {
  var str=toHoraStr(val);
  if(!str||str==='') return null;
  var p=str.split(':');
  if(p.length<2) return null;
  return parseInt(p[0])+parseInt(p[1])/60;
}

function redondear(n,dec) { return Math.round(n*Math.pow(10,dec))/Math.pow(10,dec); }

function doGet(e) {
  var p=e&&e.parameter?e.parameter:{};
  var action=p.action||'';
  var data;
  if      (action==='empleados')      data=getEmpleados(p.todos||'');
  else if (action==='novedades')      data=getNovedades(p.empId||'');
  else if (action==='marcaciones')    data=getMarcaciones(p.fecha||'',p.empId||'');
  else if (action==='horasExtra')     data=getHorasExtra(p.estado||'',p.empId||'');
  else if (action==='resumenMensual') data=calcularResumenMensual(p.periodo||'');
  else if (action==='horarios')       data=getHorarios();
  else if (action==='tiposHorario')   data=getTiposHorario();
  else if (action==='contratos')      data=getContratos(p.empId||'');
  else if (action==='alertasContratos') data=getAlertasContratos();
  else if (action==='preavisos')       data=getPreavisos(p.empId||'');
  else if (action==='controlDiario')   data=getControlDiario(p.fecha||'',p.empId||'');
  else if (action==='resumenControl')  data=getResumenControl(p.periodo||'');
  else if (action==='recalcular')      data=recalcularMarcaciones(p.mes||'',p.anio||'');
  else if (action==='vacaciones')      data=getVacaciones(p.empId||'');
  else if (action==='resumenDiario')   data=getResumenDiario(p.fecha||'');
  else if (action==='horasExtraUnificado') data=getHorasExtraUnificado(p.empId||'',p.periodo||'');
  else if (action==='resumenSemanal')  data=getResumenSemanal(p.empId||'',p.periodo||'');
  else if (action==='autorizacionesExtra') data=getAutorizacionesExtra(p.empId||'',p.fecha||'');
  else if (action==='cumpleanios')         data=getCumpleanios();
  else if (action==='aseos')              data=getAseos(p.fecha||'',p.empId||'');
  else if (action==='cumplimientoAseo')   data=getCumplimientoAseo(p.periodo||'');
  else if (action==='horarioAseo')        data=getHorarioAseo(p.empId||'',p.dia||'');
  else if (action==='getAllHorarioAseo')  data=getAllHorarioAseo();
  else if (action==='breaks')             data=getBreaks(p.fecha||'',p.empId||'');
  else data={ok:false,error:'Accion no valida'};
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var d=JSON.parse(e.postData.contents);
    var r;
    if      (d.action==='marcar')            r=guardarMarcacion(d);
    else if (d.action==='novedad')           r=guardarNovedad(d);
    else if (d.action==='aprobarNovedad')    r=aprobarNovedad(d);
    else if (d.action==='aprobarHoraExtra')  r=aprobarHoraExtra(d);
    else if (d.action==='agregarEmpleado')   r=agregarEmpleado(d);
    else if (d.action==='toggleEmpleado')    r=toggleEmpleado(d);
    else if (d.action==='retirarEmpleado')   r=retirarEmpleado(d);
    else if (d.action==='cambioHorario')     r=guardarCambioHorario(d);
    else if (d.action==='agregarHorario')    r=agregarTipoHorario(d);
    else if (d.action==='editarHorario')     r=editarTipoHorario(d);
    else if (d.action==='toggleHorario')     r=toggleTipoHorario(d);
    else if (d.action==='generarResumen')    r=generarResumenMensual(d);
    else if (d.action==='guardarContrato')   r=guardarContrato(d);
    else if (d.action==='renovarContrato')   r=renovarContrato(d);
  else if (d.action==='registrarPreaviso') r=registrarPreaviso(d);
  else if (d.action==='registrarVacaciones') r=registrarVacaciones(d);
  else if (d.action==='editarVacacion')      r=editarVacacion(d);
  else if (d.action==='eliminarVacacion')    r=eliminarVacacion(d);
  else if (d.action==='editarContrato')        r=editarContrato(d);
  else if (d.action==='retirarDesdeContrato')  r=retirarDesdeContrato(d);
  else if (d.action==='guardarAutorizacionExtra') r=guardarAutorizacionExtra(d);
  else if (d.action==='cancelarAutorizacionExtra') r=cancelarAutorizacionExtra(d);
  else if (d.action==='guardarControlDiario') r=guardarControlDiario(d);
  else if (d.action==='guardarAseo')           r=guardarAseo(d);
  else if (d.action==='guardarHorarioAseo')    r=guardarHorarioAseo(d);
  else if (d.action==='guardarBreak')          r=guardarBreak(d);
  else if (d.action==='setEstadoEspecial')     r=setEstadoEspecial(d);
    else r={ok:false,error:'Accion no valida'};
    return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET: Empleados ────────────────────────────────────────────────────
function getEmpleados(todos) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    // Leer de Empleados si existe, si no leer de Contratos
    var ws=ss.getSheetByName('Empleados');
    var desdeCont=false;
    if(!ws||ws.getLastRow()<2){
      ws=ss.getSheetByName('Contratos');
      desdeCont=true;
    }
    if(!ws) return [];
    var rows=ws.getDataRange().getValues();
    var seen={};
    var r=[];
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(!f[0]) continue;
      var empId, nom, activo, estado, cargo;
      if(desdeCont){
        empId=String(f[1]||''); if(!empId||seen[empId]) continue;
        nom=String(f[2]||'').trim();
        estado=String(f[12]||'Activo').trim();
        activo=(estado==='Activo');
        cargo=String(f[8]||'');
      } else {
        empId=String(f[0]||''); if(!empId||seen[empId]) continue;
        activo=String(f[11]||'').toUpperCase().trim()==='SI';
        estado=String(f[12]||'Activo').trim();
        nom=String(f[3]||(String(f[1])+' '+String(f[2]))).trim();
        cargo=String(f[5]||'');
      }
      if(!todos && !activo) continue;
      seen[empId]=true;
      var partes=nom.split(' ');
      var ini=((partes[0]||'?')[0]+((partes[1]||'?')[0]||'')).toUpperCase();
      r.push({id:empId,nombre:nom,iniciales:ini,
        activo:activo?'SI':'NO',estado:estado,cargo:cargo,
        contratoId:desdeCont?String(f[0]):'',
        estadoEspecial:desdeCont?String(f[17]||''):''});
    }
    r.sort(function(a,b){return a.nombre.localeCompare(b.nombre);});
    return r;
  } catch(e){return [{error:e.message}];}
}

function getMarcaciones(fecha,empId) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('Marcaciones');
    if(!ws) return [];
    var rows=ws.getDataRange().getValues();
    var r=[];
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(!f[0]) continue;
      var fFecha=toFechaStr(f[2]);
      if(fecha&&fFecha!==fecha) continue;
      if(empId&&String(f[0])!==empId) continue;
      r.push({empId:String(f[0]),nombre:String(f[1]),fecha:fFecha,
        dia:String(f[3]),codHorario:String(f[4]),
        entrada:toHoraStr(f[5]),salidaAlm:toHoraStr(f[6]),
        regresoAlm:toHoraStr(f[7]),salida:toHoraStr(f[8]),
        horasTrab:parseFloat(f[9])||0,recargoNoct:parseFloat(f[10])||0,
        recargoDom:parseFloat(f[11])||0,horasExtra:parseFloat(f[12])||0,
        estado:String(f[13]||'')});
    }
    return r;
  } catch(e){return [{error:e.message}];}
}

// ── GET: Novedades ────────────────────────────────────────────────────
function getNovedades(empId) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('Novedades');
    if(!ws) return [];
    var rows=ws.getDataRange().getValues();
    var r=[];
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(!f[0]) continue;
      if(empId&&String(f[1])!==empId) continue;
      r.push({id:String(f[0]),empId:String(f[1]),nombre:String(f[2]),
        tipo:String(f[3]),fechaInicio:toFechaStr(f[4]),
        fechaFin:toFechaStr(f[5]),dias:f[6]||1,horas:f[7]||0,
        descripcion:String(f[8]||''),estado:String(f[9]||'Pendiente'),
        observacion:String(f[10]||''),aprobadoPor:String(f[12]||''),fila:i+1});
    }
    return r;
  } catch(e){return [{error:e.message}];}
}

// ── GET: Horas Extra ─────────────────────────────────────────────────
function getHorasExtra(estado,empId) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('HorasExtra');
    if(!ws) return [];
    var rows=ws.getDataRange().getValues();
    var r=[];
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(!f[0]) continue;
      if(estado&&String(f[10])!==estado) continue;
      if(empId&&String(f[1])!==empId) continue;
      r.push({id:String(f[0]),empId:String(f[1]),nombre:String(f[2]),
        fecha:toFechaStr(f[3]),dia:String(f[4]),semana:f[5]||0,
        horasTrab:f[6]||0,horasProg:f[7]||0,horasDetec:f[8]||0,
        horasAut:f[9]||0,estado:String(f[10]||'Pendiente'),
        observacion:String(f[11]||''),aprobadoPor:String(f[12]||''),fila:i+1});
    }
    return r;
  } catch(e){return [{error:e.message}];}
}

// ── GET: Horarios ─────────────────────────────────────────────────────
function getHorarios() {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('HorarioDetalle');
    if(!ws) return [];
    var rows=ws.getDataRange().getValues();
    // Build active employees set
    var wsEmp=ss.getSheetByName('Empleados');
    var activosSet={};
    if(wsEmp){
      var empRows=wsEmp.getDataRange().getValues();
      for(var j=1;j<empRows.length;j++){
        if(String(empRows[j][11]).toUpperCase()==='SI') activosSet[String(empRows[j][0])]=true;
      }
    }
    var r=[];
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(!f[0]) continue;
      // Skip inactive employees
      if(!activosSet[String(f[1])]) continue;
      // Skip inactive horario rows
      if(String(f[11]).toUpperCase()==='NO') continue;
      r.push({id:String(f[0]),empId:String(f[1]),nombre:String(f[2]),
        dia:String(f[3]),diaCod:String(f[4]),codHorario:String(f[5]),
        entrada:toHoraStr(f[6]),salidaAlm:toHoraStr(f[7]),
        regresoAlm:toHoraStr(f[8]),salida:toHoraStr(f[9]),
        horas:f[10]||0,activo:String(f[11]||'SI'),
        horaExtra:parseFloat(f[12])||0,fila:i+1});
    }
    return r;
  } catch(e){return [{error:e.message}];}
}

// ── GET: TiposHorario ─────────────────────────────────────────────────
function getTiposHorario() {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('TiposHorario');
    if(!ws) return [];
    var rows=ws.getDataRange().getValues();
    var r=[];
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(!f[0]) continue;
      r.push({codigo:String(f[0]),descripcion:String(f[1]),
        entrada:toHoraStr(f[2]),salidaAlm:toHoraStr(f[3]),
        regresoAlm:toHoraStr(f[4]),salida:toHoraStr(f[5]),
        horas:f[6]||0,tipo:String(f[7]||''),
        recargoNoct:String(f[8]||'NO'),recargoDom:String(f[9]||'NO'),
        activo:String(f[10]||'SI'),horaExtra:parseFloat(f[11])||0,fila:i+1});
    }
    return r;
  } catch(e){return [{error:e.message}];}
}

// ── GET: Contratos ────────────────────────────────────────────────────


function guardarMarcacion(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('Marcaciones');
    if(!ws) return {ok:false,error:'No existe hoja Marcaciones'};
    var ahora=new Date();
    var hora=Utilities.formatDate(ahora,TZ,'HH:mm');
    var fecha=Utilities.formatDate(ahora,TZ,'dd/MM/yyyy');
    var dias=['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
    var dia=dias[ahora.getDay()];
    var esDom=ahora.getDay()===0;
    var esFest=FESTIVOS.indexOf(fecha)!==-1;
    // Buscar fila existente
    var filaIdx=-1;
    var datos=ws.getDataRange().getValues();
    for(var i=1;i<datos.length;i++){
      if(String(datos[i][0]).trim()===d.empId&&toFechaStr(datos[i][2])===fecha){filaIdx=i+1;break;}
    }
    var cod=getHorario(ss,d.empId,dia);
    // Columnas de foto por tipo: 19=FotoEntrada, 20=FotoSalidaAlm, 21=FotoRegresoAlm, 22=FotoSalida
    var fotoNom=d.empId+'_'+fecha.replace(/\//g,'')+'_'+(d.tipo||'marc').replace(/ /g,'');
    var foto=(d.foto&&d.foto.length>100)?saveFoto(d.foto,fotoNom):'' ;
    var lat=d.lat||''; var lng=d.lng||''; var disp=d.dispositivo||'Web';
    var filaActual=filaIdx!==-1?ws.getRange(filaIdx,1,1,22).getValues()[0]:null;

    if(d.tipo==='Entrada'){
      if(filaActual&&toHoraStr(filaActual[5])!==''){
        return {ok:false,error:'Ya registraste entrada hoy a las '+toHoraStr(filaActual[5])+'. Solo se permite una entrada por dia.'};
      }
      var estado=calcularEstado(ss,d.empId,dia,hora);
      if(filaIdx===-1){
        // 18 cols base + 4 cols foto (19-22)
        ws.appendRow([d.empId,d.empNom,fecha,dia,cod,hora,'','','','',0,0,0,estado,lat,lng,'',disp,foto,'','','']);
        filaIdx=ws.getLastRow();
        ws.getRange(filaIdx,3).setNumberFormat('@STRING@');
        ws.getRange(filaIdx,6,1,4).setNumberFormat('@STRING@');
      } else {
        ws.getRange(filaIdx,6).setNumberFormat('@STRING@').setValue(hora);
        ws.getRange(filaIdx,14).setValue(estado);
        ws.getRange(filaIdx,15).setValue(lat); ws.getRange(filaIdx,16).setValue(lng);
        if(foto) ws.getRange(filaIdx,19).setValue(foto); // col 19 = FotoEntrada
      }
      aplicarFormato(ws,filaIdx,0,0,0,estado);
      return {ok:true,hora:hora,fecha:fecha,dia:dia,estado:estado,codHorario:cod,tipo:'Entrada'};
    }
    if(filaIdx===-1) return {ok:false,error:'No hay entrada registrada para hoy. Registra primero la Entrada.'};
    if(d.tipo==='Salida almuerzo'){
      if(filaActual&&toHoraStr(filaActual[6])!=='') return {ok:false,error:'Ya registraste salida a almuerzo hoy a las '+toHoraStr(filaActual[6])+'.'};
      ws.getRange(filaIdx,7).setNumberFormat('@STRING@').setValue(hora);
      if(foto) ws.getRange(filaIdx,20).setValue(foto); // col 20 = FotoSalidaAlm
      return {ok:true,hora:hora,tipo:'Salida almuerzo'};
    }
    if(d.tipo==='Regreso almuerzo'){
      if(filaActual&&toHoraStr(filaActual[7])!=='') return {ok:false,error:'Ya registraste regreso a almuerzo hoy a las '+toHoraStr(filaActual[7])+'.'};
      ws.getRange(filaIdx,8).setNumberFormat('@STRING@').setValue(hora);
      if(foto) ws.getRange(filaIdx,21).setValue(foto); // col 21 = FotoRegresoAlm
      return {ok:true,hora:hora,tipo:'Regreso almuerzo'};
    }
    if(d.tipo==='Salida'){
      if(filaActual&&toHoraStr(filaActual[8])!=='') return {ok:false,error:'Ya registraste salida hoy a las '+toHoraStr(filaActual[8])+'.'};
      ws.getRange(filaIdx,9).setNumberFormat('@STRING@').setValue(hora);
      if(foto) ws.getRange(filaIdx,22).setValue(foto); // col 22 = FotoSalida
      var filaData=ws.getRange(filaIdx,1,1,18).getValues()[0];
      var hEnt=getHorasDecimal(filaData[5]);
      var hSAlm=getHorasDecimal(filaData[6]);
      var hRAlm=getHorasDecimal(filaData[7]);
      var hSal=getHorasDecimal(hora);
      // Almuerzo: solo descontar si AMBOS registros existen (salida Y regreso)
      // Si no hay registro de almuerzo, no se descuenta nada (no asumir 1h)
      var almuerzo=(hSAlm!==null&&hRAlm!==null)?Math.max(0,hRAlm-hSAlm):0;
      var horasTrab=redondear(Math.max(0,hSal-hEnt-almuerzo),2);
      var hSalNum=hSal; // ya es decimal
      // Recargo nocturno: máximo 1 hora fija si sale después de 19:00
      // Solo se reconoce el tramo 19:00-20:00 (1h), sin importar cuánto más tarde salga
      var noct=(hSalNum>19)?1.0:0;
      var dom=(esDom||esFest)?horasTrab:0;
      ws.getRange(filaIdx,10).setValue(horasTrab).setNumberFormat('0.00');
      ws.getRange(filaIdx,11).setValue(noct).setNumberFormat('0.0');
      ws.getRange(filaIdx,12).setValue(dom).setNumberFormat('0.0');
      ws.getRange(filaIdx,13).setValue(0);
      var estActual=String(filaData[13]||'Valida');
      aplicarFormato(ws,filaIdx,noct,dom,0,estActual);
      // ── Horas extra: SOLO si hay autorización explícita Y la semana supera 42h ──
      // Regla: no se pagan horas extra por trabajar más horas en un día
      // Solo se generan cuando: 1) hay autorización, 2) total semanal > 42h
      var autActiva=getAutActiva(ss,d.empId,fecha);
      var horasAutorizadas=autActiva?autActiva.horas:0;
      var horasAcumSem=calcularHorasSemana(ss,d.empId,fecha);
      var totalConHoy=redondear(horasAcumSem+horasTrab,1);
      var limSemanal=getLimiteHorasSemanales(); // 42h
      // Solo crear registro de extra si: tiene autorización Y supera 42h semanales
      var horasExtraDetec=0;
      if(horasAutorizadas>0 && totalConHoy>limSemanal){
        horasExtraDetec=redondear(Math.min(horasAutorizadas, totalConHoy-limSemanal),1);
        crearRegistroHoraExtra(ss,d.empId,d.empNom,fecha,dia,horasTrab,
          getHorasConExtra(ss,d.empId,dia).horas,horasExtraDetec);
      }
      return {ok:true,hora:hora,tipo:'Salida',horasTrabajadas:horasTrab,
              recargoNocturno:noct,recargoDominical:dom,horasExtra:horasExtraDetec,
              horasSemana:totalConHoy,limSemanal:limSemanal,
              horasAutorizadas:horasAutorizadas};
    }
    return {ok:false,error:'Tipo no reconocido'};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Retirar Empleado (no borra, cambia estado) ─────────────────
function retirarEmpleado(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('Empleados');
    if(!ws) return {ok:false,error:'No existe hoja Empleados'};
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0])===d.empId){
        ws.getRange(i+1,12).setValue('NO'); // Activo = NO
        // Columna M = estado (Activo/Retirado)
        var wsHdr=ws.getRange(1,13).getValue();
        if(!wsHdr||wsHdr===''){ws.getRange(1,13).setValue('Estado').setBackground('#1E3A5F').setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');}
        ws.getRange(i+1,13).setValue('Retirado')
          .setBackground('#F5F5F5').setFontColor('#9E9E9E')
          .setFontWeight('bold').setHorizontalAlignment('center');
        ws.getRange(i+1,14).setValue(d.fechaRetiro||Utilities.formatDate(new Date(),TZ,'dd/MM/yyyy'));
        ws.getRange(i+1,15).setValue(d.motivo||'');
        // Cerrar contrato activo
        var wsC=ss.getSheetByName('Contratos');
        if(wsC){
          var cRows=wsC.getDataRange().getValues();
          for(var j=1;j<cRows.length;j++){
            if(String(cRows[j][1])===d.empId&&String(cRows[j][12])==='Activo'){
              wsC.getRange(j+1,13).setValue('Retirado').setBackground('#F5F5F5').setFontColor('#9E9E9E').setFontWeight('bold').setHorizontalAlignment('center');
            }
          }
        }
        return {ok:true,empId:d.empId,estado:'Retirado'};
      }
    }
    return {ok:false,error:'Empleado no encontrado'};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Toggle Empleado (activar/desactivar sin retirar) ────────────
function toggleEmpleado(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('Empleados');
    if(!ws) return {ok:false,error:'No existe hoja Empleados'};
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0])===d.empId){
        var nuevo=d.activo==='SI'?'SI':'NO';
        var bg=nuevo==='SI'?'#E8F5E9':'#FCEBEB';
        var fg=nuevo==='SI'?'#2E7D32':'#C62828';
        ws.getRange(i+1,12).setValue(nuevo).setBackground(bg).setFontColor(fg).setFontWeight('bold').setHorizontalAlignment('center');
        return {ok:true,empId:d.empId,activo:nuevo};
      }
    }
    return {ok:false,error:'Empleado no encontrado'};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Agregar Empleado ────────────────────────────────────────────
function agregarEmpleado(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('Empleados');
    if(!ws) return {ok:false,error:'No existe hoja Empleados'};
    var rows=ws.getDataRange().getValues();
    var maxId=0;
    for(var i=1;i<rows.length;i++){
      var id=String(rows[i][0]);
      if(id.startsWith('EMP')){var n=parseInt(id.replace('EMP',''));if(n>maxId)maxId=n;}
    }
    var newId='EMP'+String(maxId+1).padStart(3,'0');
    var nom=(d.nombre||'')+' '+(d.apellido||'');
    ws.appendRow([newId,d.nombre||'',d.apellido||'',nom.trim(),
                  d.cedula||'',d.cargo||'',d.telefono||'',d.correo||'',
                  d.fechaIngreso||'',d.tipoContrato||'Indefinido',d.salario||'','SI','Activo','','']);
    // Crear filas vacias en HorarioDetalle para los 6 dias
    var wsHD = ss.getSheetByName('HorarioDetalle');
    if (wsHD) {
      var dias = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
      var hdRows = wsHD.getDataRange().getValues();
      var hdMax = 0;
      for (var k = 1; k < hdRows.length; k++) {
        var hdId = String(hdRows[k][0]);
        if (hdId.startsWith('HD')) {
          var n = parseInt(hdId.replace('HD',''));
          if (n > hdMax) hdMax = n;
        }
      }
      dias.forEach(function(dia, idx) {
        var hdId = 'HD' + String(hdMax + idx + 1).padStart(3,'0');
        wsHD.appendRow([hdId, newId, nom.trim(), dia, dia.substring(0,3).toUpperCase(),
                        '','','','','',0,'SI',0]);
      });
    }
    return {ok:true,id:newId,nombre:nom.trim()};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Cambio Horario ──────────────────────────────────────────────
function guardarCambioHorario(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('CambiosHorario');
    if(!ws) return {ok:false,error:'No existe hoja CambiosHorario'};
    var ahora=new Date();
    var fecha=Utilities.formatDate(ahora,TZ,'dd/MM/yyyy');
    var rows=ws.getDataRange().getValues();
    var id='CH'+String(rows.length).padStart(3,'0');
    ws.appendRow([id,d.empId,d.empNom,d.fechaInicio||fecha,d.fechaFin||fecha,
                  d.diaSemana||'',d.codHorarioNuevo||'',d.descripcion||'',
                  d.tipo||'Permanente',d.motivo||'',d.aprobadoPor||'','Activo']);
    if(d.diaSemana&&d.codHorarioNuevo) actualizarHorarioDetalle(ss,d.empId,d.diaSemana,d.codHorarioNuevo);
    else if(d.diaSemana&&d.limpiar) limpiarHorarioDetalle(ss,d.empId,d.diaSemana);
    // Guardar hora extra autorizada en HorarioDetalle col 13
    if(d.diaSemana&&d.horaExtraAutorizada!==undefined) {
      actualizarHoraExtraDetalle(ss,d.empId,d.diaSemana,parseFloat(d.horaExtraAutorizada)||0);
    }
    return {ok:true,id:id};
  } catch(e){return {ok:false,error:e.message};}
}


function limpiarHorarioDetalle(ss, empId, dia) {
  try {
    var ws=ss.getSheetByName('HorarioDetalle'); if(!ws) return;
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][1])===empId&&String(rows[i][3])===dia){
        ws.getRange(i+1,6).setValue('');   // CodHorario
        ws.getRange(i+1,7).setValue('');   // Entrada
        ws.getRange(i+1,8).setValue('');   // SalidaAlm
        ws.getRange(i+1,9).setValue('');   // RegresoAlm
        ws.getRange(i+1,10).setValue('');  // Salida
        ws.getRange(i+1,11).setValue(0);   // Horas
        return;
      }
    }
  } catch(e){Logger.log('Error limpiarHorarioDetalle: '+e.message);}
}
function actualizarHoraExtraDetalle(ss, empId, dia, horaExtra) {
  try {
    var ws=ss.getSheetByName('HorarioDetalle'); if(!ws) return;
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][1])===empId&&String(rows[i][3])===dia){
        // Col 13 (index 12) = HoraExtraAutorizada
        ws.getRange(i+1,13).setValue(horaExtra).setNumberFormat('0.0')
          .setBackground(horaExtra>0?'#EDE7F6':'#FAFAFA')
          .setFontColor(horaExtra>0?'#6A1B9A':'#BDBDBD')
          .setHorizontalAlignment('center');
        return;
      }
    }
  } catch(e){Logger.log('Error actualizarHoraExtraDetalle: '+e.message);}
}

// ── POST: Agregar Tipo Horario ────────────────────────────────────────
function agregarTipoHorario(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('TiposHorario');
    if(!ws) return {ok:false,error:'No existe hoja TiposHorario'};
    var rows=ws.getDataRange().getValues();
    var maxN=0;
    for(var i=1;i<rows.length;i++){
      var cod=String(rows[i][0]);
      if(cod.startsWith('H')){var n=parseInt(cod.replace('H',''));if(n>maxN)maxN=n;}
    }
    var newCod='H'+String(maxN+1).padStart(2,'0');
    ws.appendRow([newCod,d.descripcion||'',d.entrada||'',d.salidaAlm||'',
                  d.regresoAlm||'',d.salida||'',d.horas||0,d.tipo||'Completa',
                  d.recargoNoct||'NO',d.recargoDom||'NO','SI',d.horaExtra||0]);
    return {ok:true,codigo:newCod};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Editar Tipo Horario ─────────────────────────────────────────
function editarTipoHorario(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('TiposHorario');
    if(!ws) return {ok:false,error:'No existe hoja TiposHorario'};
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0])===d.codigo){
        var fila=i+1;
        ws.getRange(fila,2).setValue(d.descripcion||rows[i][1]);
        ws.getRange(fila,3).setValue(d.entrada||rows[i][2]);
        ws.getRange(fila,4).setValue(d.salidaAlm||rows[i][3]);
        ws.getRange(fila,5).setValue(d.regresoAlm||rows[i][4]);
        ws.getRange(fila,6).setValue(d.salida||rows[i][5]);
        ws.getRange(fila,7).setValue(d.horas||rows[i][6]);
        ws.getRange(fila,8).setValue(d.tipo||rows[i][7]);
        ws.getRange(fila,9).setValue(d.recargoNoct||rows[i][8]);
        ws.getRange(fila,10).setValue(d.recargoDom||rows[i][9]);
        ws.getRange(fila,12).setValue(d.horaExtra||0);
        return {ok:true,codigo:d.codigo};
      }
    }
    return {ok:false,error:'Horario no encontrado'};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Activar/Desactivar Tipo Horario ─────────────────────────────
function toggleTipoHorario(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('TiposHorario');
    if(!ws) return {ok:false,error:'No existe hoja TiposHorario'};
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0])===d.codigo){
        var nuevo=d.activo==='SI'?'SI':'NO';
        ws.getRange(i+1,11).setValue(nuevo);
        return {ok:true,codigo:d.codigo,activo:nuevo};
      }
    }
    return {ok:false,error:'Horario no encontrado'};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Aprobar Novedad ─────────────────────────────────────────────
function aprobarNovedad(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('Novedades');
    if(!ws) return {ok:false,error:'No existe hoja Novedades'};
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0])===d.novedadId){
        var fila=i+1;
        ws.getRange(fila,10).setValue(d.estado);
        ws.getRange(fila,11).setValue(d.observacion||'');
        ws.getRange(fila,13).setValue(d.aprobadoPor||'');
        var bg=d.estado==='Aprobada'?'#E8F5E9':d.estado==='Rechazada'?'#FCEBEB':'#FFF9C4';
        var fg=d.estado==='Aprobada'?'#2E7D32':d.estado==='Rechazada'?'#C62828':'#C9A84C';
        ws.getRange(fila,10).setBackground(bg).setFontColor(fg).setFontWeight('bold').setHorizontalAlignment('center');
        return {ok:true,estado:d.estado};
      }
    }
    return {ok:false,error:'Novedad no encontrada'};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Aprobar Hora Extra ──────────────────────────────────────────
function aprobarHoraExtra(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('HorasExtra');
    if(!ws) return {ok:false,error:'No existe hoja HorasExtra'};
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0])===d.horaExtraId){
        var fila=i+1;
        var horasAut=parseFloat(d.horasAutorizadas)||0;
        ws.getRange(fila,10).setValue(horasAut);
        ws.getRange(fila,11).setValue(d.estado);
        ws.getRange(fila,12).setValue(d.observacion||'');
        ws.getRange(fila,13).setValue(d.aprobadoPor||'Admin');
        ws.getRange(fila,14).setValue(Utilities.formatDate(new Date(),TZ,'dd/MM/yyyy'));
        var bg=d.estado==='Aprobada'?'#E8F5E9':d.estado==='Rechazada'?'#FCEBEB':'#FFF9C4';
        var fg=d.estado==='Aprobada'?'#2E7D32':d.estado==='Rechazada'?'#C62828':'#C9A84C';
        ws.getRange(fila,11).setBackground(bg).setFontColor(fg).setFontWeight('bold').setHorizontalAlignment('center');
        if(d.estado==='Aprobada'){
          actualizarHorasExtraEnMarcacion(ss,String(rows[i][1]),toFechaStr(rows[i][3]),horasAut);
        }
        return {ok:true,estado:d.estado,horasAutorizadas:horasAut};
      }
    }
    return {ok:false,error:'Registro no encontrado'};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Guardar Novedad ─────────────────────────────────────────────
function guardarNovedad(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('Novedades');
    if(!ws) return {ok:false,error:'No existe hoja Novedades'};
    var ahora=new Date();
    var fecha=Utilities.formatDate(ahora,TZ,'dd/MM/yyyy');
    var hora=Utilities.formatDate(ahora,TZ,'HH:mm');
    var id='N'+Utilities.formatDate(ahora,TZ,'yyyyMMddHHmmss');
    ws.appendRow([id,d.empId,d.empNom,d.tipo,
                  d.fechaInicio||fecha,d.fechaFin||fecha,
                  d.dias||1,d.horas||0,d.descripcion||'',
                  'Pendiente','',fecha+' '+hora,'']);
    var lr=ws.getLastRow();
    ws.getRange(lr,1,1,13).setBackground('#FFF9C4').setFontSize(10).setVerticalAlignment('middle');
    ws.getRange(lr,10).setBackground('#FFF3E0').setFontColor('#E65100').setFontWeight('bold').setHorizontalAlignment('center');
    return {ok:true,id:id};
  } catch(e){return {ok:false,error:e.message};}
}

// ── POST: Generar Resumen Mensual ─────────────────────────────────────
function generarResumenMensual(d) {
  try {
    var periodo=d.periodo||'';
    var datos=calcularResumenMensual(periodo);
    if(!datos||datos.error) return {ok:false,error:(datos&&datos.error)||'Error'};
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('ResumenMensual');
    if(!ws) return {ok:false,error:'No existe hoja ResumenMensual'};
    var rows=ws.getDataRange().getValues();
    for(var i=rows.length-1;i>=1;i--){if(String(rows[i][0])===periodo) ws.deleteRow(i+1);}
    datos.forEach(function(e){
      var semStr=e.semanas.map(function(s){return 'S'+s.semana+':'+s.dias+'d/'+s.horas+'h';}).join(' | ');
      ws.appendRow([periodo,e.empId,e.nombre,e.diasProg,e.diasLab,e.ausentes,e.retardos,
                    e.horas,e.horasExtra,e.recargoNoct,e.recargoDom,e.cumplimiento+'%',semStr]);
      var lr=ws.getLastRow();
      ws.getRange(lr,1,1,13).setFontSize(10).setVerticalAlignment('middle')
        .setBorder(true,true,true,true,true,true,'#B0C4D8',SpreadsheetApp.BorderStyle.SOLID);
      ws.setRowHeight(lr,22);
      var pct=e.cumplimiento;
      var bg=pct>=90?'#E8F5E9':pct>=70?'#FFF8E1':'#FCEBEB';
      var fg=pct>=90?'#2E7D32':pct>=70?'#F57F17':'#C62828';
      ws.getRange(lr,12).setBackground(bg).setFontColor(fg).setFontWeight('bold').setHorizontalAlignment('center');
      ws.getRange(lr,10).setBackground(e.recargoNoct>0?'#FFF3E0':'#FAFAFA').setFontColor(e.recargoNoct>0?'#E65100':'#BDBDBD').setHorizontalAlignment('center');
      ws.getRange(lr,11).setBackground(e.recargoDom>0?'#E8F5E9':'#FAFAFA').setFontColor(e.recargoDom>0?'#2E7D32':'#BDBDBD').setHorizontalAlignment('center');
    });
    return {ok:true,registros:datos.length,periodo:periodo};
  } catch(e){return {ok:false,error:e.message};}
}

// ── Calcular Resumen Mensual ──────────────────────────────────────────
function calcularResumenMensual(periodo) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    if(!periodo) periodo=Utilities.formatDate(new Date(),TZ,'MM/yyyy');
    var p=periodo.split('/');
    var mes=parseInt(p[0]),anio=parseInt(p[1]);
    var wsMar=ss.getSheetByName('Marcaciones');
    var wsEmp=ss.getSheetByName('Empleados');
    var wsHor=ss.getSheetByName('HorarioDetalle');
    var wsHE=ss.getSheetByName('HorasExtra');
    if(!wsMar||!wsEmp) return {error:'Faltan hojas'};
    var marcRows=wsMar.getDataRange().getValues();
    var horRows=wsHor?wsHor.getDataRange().getValues():[];
    var heRows=wsHE?wsHE.getDataRange().getValues():[];
    var porEmp={};
    for(var i=1;i<marcRows.length;i++){
      var f=marcRows[i]; if(!f[0]) continue;
      var fFecha=toFechaStr(f[2]); if(!fFecha) continue;
      var pf=fFecha.split('/');
      if(parseInt(pf[1])!==mes||parseInt(pf[2])!==anio) continue;
      var empId=String(f[0]);
      if(!porEmp[empId]) porEmp[empId]={nombre:String(f[1]),dias:0,horas:0,horasExtra:0,recargoNoct:0,recargoDom:0,retardos:0,semanas:{}};
      var e=porEmp[empId];
      e.dias++;
      var ht=parseFloat(f[9])||0;
      e.horas+=ht;
      e.recargoNoct+=parseFloat(f[10])||0;
      e.recargoDom+=parseFloat(f[11])||0;
      if(String(f[13])==='Retardo') e.retardos++;
      var sem=Math.ceil(parseInt(pf[0])/7);
      var sk='S'+sem;
      if(!e.semanas[sk]) e.semanas[sk]={dias:0,horas:0};
      e.semanas[sk].dias++; e.semanas[sk].horas+=ht;
    }
    // Solo horas extra aprobadas
    for(var i=1;i<heRows.length;i++){
      var f=heRows[i]; if(!f[0]) continue;
      if(String(f[10])!=='Aprobada') continue;
      var fFecha=toFechaStr(f[3]); if(!fFecha) continue;
      var pf=fFecha.split('/');
      if(parseInt(pf[1])!==mes||parseInt(pf[2])!==anio) continue;
      var empId=String(f[1]);
      if(porEmp[empId]) porEmp[empId].horasExtra+=parseFloat(f[9])||0;
    }
    // Dias programados
    var diasDelMes=new Date(anio,mes,0).getDate();
    for(var empId in porEmp){
      var diasProg=0;
      for(var dd=1;dd<=diasDelMes;dd++){
        var fd=new Date(anio,mes-1,dd);
        var diaSem=['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'][fd.getDay()];
        if(diaSem==='Domingo') continue;
        for(var h=0;h<horRows.length;h++){
          if(String(horRows[h][1])===empId&&String(horRows[h][3])===diaSem){
            var cod=String(horRows[h][5]);
            if(cod!=='H19'&&cod!=='H17'&&cod!=='H18') diasProg++;
            break;
          }
        }
      }
      porEmp[empId].diasProg=diasProg;
      porEmp[empId].ausentes=Math.max(0,diasProg-porEmp[empId].dias);
    }
    var resultado=[];
    for(var empId in porEmp){
      var e=porEmp[empId];
      var semResumen=[];
      for(var s=1;s<=5;s++){
        var sk='S'+s;
        if(e.semanas[sk]) semResumen.push({semana:s,dias:e.semanas[sk].dias,horas:redondear(e.semanas[sk].horas,1)});
      }
      resultado.push({empId:empId,nombre:e.nombre,periodo:periodo,
        diasProg:e.diasProg,diasLab:e.dias,ausentes:e.ausentes,
        retardos:e.retardos,horas:redondear(e.horas,1),
        horasExtra:redondear(e.horasExtra,1),
        recargoNoct:redondear(e.recargoNoct,1),recargoDom:redondear(e.recargoDom,1),
        cumplimiento:e.diasProg>0?Math.round((e.dias/e.diasProg)*100):0,
        semanas:semResumen});
    }
    return resultado;
  } catch(e){return {error:e.message};}
}


// ── Resumen diario: marcaciones + control del dia ─────────────────
function getResumenDiario(fecha) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    if(!fecha) fecha=Utilities.formatDate(new Date(),TZ,'dd/MM/yyyy');
    var wsMar=ss.getSheetByName('Marcaciones');
    var wsCtrl=ss.getSheetByName('ControlDiario');
    var wsEmp=ss.getSheetByName('Empleados');
    if(!wsMar||!wsEmp) return {error:'Faltan hojas'};
    var marcRows=wsMar.getDataRange().getValues();
    var ctrlRows=wsCtrl?wsCtrl.getDataRange().getValues():[];
    var empRows=wsEmp.getDataRange().getValues();
    // Mapa de control del dia
    var ctrlMap={};
    for(var i=1;i<ctrlRows.length;i++){
      var f=ctrlRows[i]; if(!f[0]) continue;
      if(toFechaStr(f[1])!==fecha) continue;
      ctrlMap[String(f[3])]={camisa:String(f[5]||''),pantalon:String(f[6]||''),
        celular:String(f[7]||''),aseo:String(f[8]||''),radar:String(f[9]||''),
        obs:String(f[10]||'')};
    }
    // Marcaciones del dia por empleado
    var marcMap={};
    for(var i=1;i<marcRows.length;i++){
      var f=marcRows[i]; if(!f[0]) continue;
      if(toFechaStr(f[2])!==fecha) continue;
      var eid=String(f[0]);
      marcMap[eid]={nombre:String(f[1]),codH:String(f[4]||''),
        entrada:toHoraStr(f[5]),salidaAlm:toHoraStr(f[6]),
        regresoAlm:toHoraStr(f[7]),salida:toHoraStr(f[8]),
        horas:parseFloat(f[9])||0,recargoNoct:parseFloat(f[10])||0,
        recargoDom:parseFloat(f[11])||0,horasExtra:parseFloat(f[12])||0,
        estado:String(f[13]||'')};
    }
    // Combinar: todos los empleados activos
    var resultado=[];
    for(var i=1;i<empRows.length;i++){
      var f=empRows[i]; if(!f[0]||String(f[11])!=='SI') continue;
      var eid=String(f[0]);
      var marc=marcMap[eid]||null;
      var ctrl=ctrlMap[eid]||null;
      resultado.push({empId:eid,nombre:String(f[3]),cargo:String(f[5]||''),
        marcacion:marc,control:ctrl,fecha:fecha});
    }
    return resultado;
  } catch(e){return {error:e.message};}
}

// ── Resumen semanal: marcaciones agrupadas por semana ─────────────
function getResumenSemanal(empId,periodo) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    if(!periodo) periodo=Utilities.formatDate(new Date(),TZ,'MM/yyyy');
    var p=periodo.split('/');
    var mes=parseInt(p[0]),anio=parseInt(p[1]);
    var wsMar=ss.getSheetByName('Marcaciones');
    if(!wsMar) return [];
    var rows=wsMar.getDataRange().getValues();
    var semanas={};
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(!f[0]) continue;
      if(empId&&String(f[0])!==empId) continue;
      var fFecha=toFechaStr(f[2]); if(!fFecha) continue;
      var pf=fFecha.split('/');
      if(parseInt(pf[1])!==mes||parseInt(pf[2])!==anio) continue;
      var lun=getLunesDeSemana(fFecha);
      var sk=lun;
      if(!semanas[sk]) semanas[sk]={lunes:lun,dias:0,horas:0,noct:0,dom:0,extra:0,empIds:{}};
      var s=semanas[sk];
      s.dias++;
      s.horas+=parseFloat(f[9])||0;
      s.noct+=parseFloat(f[10])||0;
      s.dom+=parseFloat(f[11])||0;
      s.extra+=parseFloat(f[12])||0;
      s.empIds[String(f[0])]=true;
    }
    var resultado=[];
    var keys=Object.keys(semanas).sort();
    for(var k=0;k<keys.length;k++){
      var s=semanas[keys[k]];
      resultado.push({lunes:s.lunes,dias:s.dias,
        horas:redondear(s.horas,1),noct:redondear(s.noct,1),
        dom:redondear(s.dom,1),extra:redondear(s.extra,1),
        colaboradores:Object.keys(s.empIds).length,
        superaLimite:s.horas>42});
    }
    return resultado;
  } catch(e){return {error:e.message};}
}


// ── Estado especial empleado: Vacaciones/Permiso/Licencia ─────────
function setEstadoEspecial(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Contratos');
    if (!ws) return {ok:false,error:'No existe hoja Contratos'};
    var rows = ws.getDataRange().getValues();
    // Asegurar col 18 existe
    if (ws.getLastColumn() < 18) {
      ws.getRange(1,18).setValue('EstadoEspecial');
    }
    var updated = false;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === d.empId && String(rows[i][12]) === 'Activo') {
        ws.getRange(i+1, 18).setValue(d.estado||'');
        // Si tiene estado especial, marcar HorarioDetalle como suspendido
        var wsHor = ss.getSheetByName('HorarioDetalle');
        if (wsHor) {
          var horRows = wsHor.getDataRange().getValues();
          for (var j = 1; j < horRows.length; j++) {
            if (String(horRows[j][1]) === d.empId) {
              // col 12 = Activo, col 13 = HoraExtraAutorizada
              // Usamos un prefijo en HoraExtraAutorizada para marcar suspensión
              wsHor.getRange(j+1, 12).setValue(d.estado?'NO':'SI');
            }
          }
        }
        updated = true;
        break;
      }
    }
    if (!updated) return {ok:false,error:'Contrato activo no encontrado'};
    return {ok:true, empId:d.empId, estado:d.estado||'Activo'};
  } catch(e){return {ok:false,error:e.message};}
}

// ── H.Extra unificado: detectadas + autorizadas ───────────────────
function getHorasExtraUnificado(empId, periodo) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var wsHE = ss.getSheetByName('HorasExtra');
    var wsAE = ss.getSheetByName('AutorizacionesExtra');
    var result = {detectadas:[], autorizadas:[]};

    if (wsHE) {
      var rows = wsHE.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var f = rows[i]; if (!f[0]) continue;
        if (empId && String(f[1]) !== empId) continue;
        if (periodo) {
          var ff = toFechaStr(f[3]); if (!ff) continue;
          var pp = ff.split('/');
          if (pp[1]+'/'+pp[2] !== periodo) continue;
        }
        result.detectadas.push({
          id:String(f[0]),empId:String(f[1]),nombre:String(f[2]),
          fecha:toFechaStr(f[3]),dia:String(f[4]),semana:f[5]||0,
          horasTrab:f[6]||0,horasProg:f[7]||0,horasDetec:f[8]||0,
          horasAut:f[9]||0,estado:String(f[10]||''),obs:String(f[11]||''),
          aprobadoPor:String(f[12]||'')
        });
      }
    }

    if (wsAE) {
      var rows = wsAE.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var f = rows[i]; if (!f[0]) continue;
        if (empId && String(f[1]) !== empId) continue;
        result.autorizadas.push({
          id:String(f[0]),empId:String(f[1]),nombre:String(f[2]),
          codHorario:String(f[3]),fechaInicio:toFechaStr(f[4]),
          fechaFin:toFechaStr(f[5]),tipo:String(f[6]||''),
          horasAut:f[7]||0,obs:String(f[8]||''),
          estado:String(f[9]||''),aprobadoPor:String(f[10]||'')
        });
      }
    }
    return result;
  } catch(e){return {error:e.message};}
}
// ── Utilidades ────────────────────────────────────────────────────────
function calcularHorasSemana(ss,empId,fechaActual) {
  try {
    var ws=ss.getSheetByName('Marcaciones'); if(!ws) return 0;
    var lunes=getLunesDeSemana(fechaActual);
    var lunesDate=parseFecha(lunes);
    var actualDate=parseFecha(fechaActual);
    var rows=ws.getDataRange().getValues();
    var total=0;
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(String(f[0])!==empId) continue;
      var fFecha=toFechaStr(f[2]); if(!fFecha) continue;
      var fd=parseFecha(fFecha);
      if(fd>=lunesDate&&fd<actualDate) total+=parseFloat(f[9])||0;
    }
    return redondear(total,2);
  } catch(e){return 0;}
}

function crearRegistroHoraExtra(ss,empId,empNom,fecha,dia,horasTrab,horasProg,horasDetec) {
  try {
    var ws=ss.getSheetByName('HorasExtra'); if(!ws) return;
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][1])===empId&&toFechaStr(rows[i][3])===fecha){
        ws.getRange(i+1,7).setValue(horasTrab);
        ws.getRange(i+1,9).setValue(horasDetec);
        ws.getRange(i+1,10).setValue(horasDetec);
        return;
      }
    }
    var ahora=new Date();
    var semana=getSemanaDelMes(fecha);
    var id='HE'+Utilities.formatDate(ahora,TZ,'yyyyMMddHHmmss');
    ws.appendRow([id,empId,empNom,fecha,dia,semana,horasTrab,horasProg,horasDetec,horasDetec,'Pendiente','','',Utilities.formatDate(ahora,TZ,'dd/MM/yyyy')]);
    var lr=ws.getLastRow();
    ws.getRange(lr,1,1,14).setBackground('#FFF9C4').setFontSize(10).setVerticalAlignment('middle');
    ws.getRange(lr,11).setBackground('#FFF3E0').setFontColor('#E65100').setFontWeight('bold').setHorizontalAlignment('center');
  } catch(e){Logger.log('Error HorasExtra: '+e.message);}
}

function actualizarHorasExtraEnMarcacion(ss,empId,fecha,horas) {
  try {
    var ws=ss.getSheetByName('Marcaciones'); if(!ws) return;
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0])===empId&&toFechaStr(rows[i][2])===fecha){
        ws.getRange(i+1,13).setValue(horas).setNumberFormat('0.0'); return;
      }
    }
  } catch(e){}
}

function getHorasProgramadas(ss,empId,dia) {
  try {
    var ws=ss.getSheetByName('HorarioDetalle'); if(!ws) return 8;
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][1])===empId&&String(rows[i][3])===dia) return parseFloat(rows[i][10])||8;
    }
  } catch(e){}
  return 8;
}

function getHorasConExtra(ss,empId,dia) {
  // Retorna {horas, horaExtra} para calcular jornada total autorizada
  try {
    var ws=ss.getSheetByName('HorarioDetalle'); if(!ws) return {horas:8,horaExtra:0};
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][1])===empId&&String(rows[i][3])===dia){
        return {horas:parseFloat(rows[i][10])||8, horaExtra:parseFloat(rows[i][12])||0};
      }
    }
  } catch(e){}
  return {horas:8,horaExtra:0};
}

function calcularEstado(ss,empId,dia,hora) {
  try {
    var ws=ss.getSheetByName('HorarioDetalle'); if(!ws) return 'Valida';
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][1])===empId&&String(rows[i][3])===dia){
        var he=toHoraStr(rows[i][6]);
        if(he&&he!=='--'&&he!==''&&he.indexOf(':')>-1){
          var p1=he.split(':'),p2=hora.split(':');
          var diff=(parseInt(p2[0])*60+parseInt(p2[1]))-(parseInt(p1[0])*60+parseInt(p1[1]));
          if(diff>10) return 'Retardo';
        }
        break;
      }
    }
  } catch(e){}
  return 'Valida';
}

function getHorario(ss,empId,dia) {
  try {
    var ws=ss.getSheetByName('HorarioDetalle'); if(!ws) return '-';
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][1])===empId&&String(rows[i][3])===dia) return String(rows[i][5]||'-');
    }
  } catch(e){}
  return '-';
}

function actualizarHorarioDetalle(ss,empId,dia,codHorario) {
  try {
    var wsHor=ss.getSheetByName('HorarioDetalle'); if(!wsHor) return;
    var wsTip=ss.getSheetByName('TiposHorario'); if(!wsTip) return;
    // Buscar datos del tipo de horario nuevo
    var tipRows=wsTip.getDataRange().getValues();
    var tipData=null;
    for(var t=1;t<tipRows.length;t++){
      if(String(tipRows[t][0])===codHorario){tipData=tipRows[t];break;}
    }
    if(!tipData) return;
    // Actualizar fila en HorarioDetalle
    var rows=wsHor.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][1])===empId&&String(rows[i][3])===dia){
        var fila=i+1;
        wsHor.getRange(fila,6).setValue(codHorario);           // CodHorario
        wsHor.getRange(fila,7).setValue(toHoraStr(tipData[2])); // Entrada
        wsHor.getRange(fila,8).setValue(toHoraStr(tipData[3])); // SalidaAlm
        wsHor.getRange(fila,9).setValue(toHoraStr(tipData[4])); // RegresoAlm
        wsHor.getRange(fila,10).setValue(toHoraStr(tipData[5]));// Salida
        wsHor.getRange(fila,11).setValue(tipData[6]||0);        // Horas
        // Formato texto horas
        wsHor.getRange(fila,7,1,4).setNumberFormat('@STRING@');
        return;
      }
    }
    // Si no existe la fila, crearla
    if(tipData){
      var lastRow=wsHor.getLastRow();
      var newId='HD'+(lastRow).toString().padStart(3,'0');
      wsHor.appendRow([newId,empId,'',dia,'',codHorario,
        toHoraStr(tipData[2]),toHoraStr(tipData[3]),
        toHoraStr(tipData[4]),toHoraStr(tipData[5]),
        tipData[6]||0,'SI',0]);
      wsHor.getRange(wsHor.getLastRow(),7,1,4).setNumberFormat('@STRING@');
    }
  } catch(e){Logger.log('Error actualizarHorarioDetalle: '+e.message);}
}

function aplicarFormato(ws,fila,noct,dom,extra,estado) {
  var alt=(fila%2===0);
  ws.getRange(fila,1,1,18).setBackground(alt?'#F2F7FC':'#FFFFFF')
    .setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle')
    .setBorder(true,true,true,true,true,true,'#B0C4D8',SpreadsheetApp.BorderStyle.SOLID);
  ws.setRowHeight(fila,22);
  ws.getRange(fila,5).setBackground('#FFF9C4').setFontColor('#C9A84C').setFontWeight('bold').setHorizontalAlignment('center');
  ws.getRange(fila,11).setBackground(noct>0?'#FFF3E0':'#FAFAFA').setFontColor(noct>0?'#E65100':'#BDBDBD').setFontWeight(noct>0?'bold':'normal').setHorizontalAlignment('center');
  ws.getRange(fila,12).setBackground(dom>0?'#E8F5E9':'#FAFAFA').setFontColor(dom>0?'#2E7D32':'#BDBDBD').setFontWeight(dom>0?'bold':'normal').setHorizontalAlignment('center');
  ws.getRange(fila,13).setBackground(extra>0?'#EDE7F6':'#FAFAFA').setFontColor(extra>0?'#6A1B9A':'#BDBDBD').setFontWeight(extra>0?'bold':'normal').setHorizontalAlignment('center');
  var estBg='#E8F5E9',estFg='#2E7D32';
  if(estado==='Retardo'){estBg='#FFF8E1';estFg='#F57F17';}
  if(estado==='Invalida'){estBg='#FCEBEB';estFg='#C62828';}
  ws.getRange(fila,14).setBackground(estBg).setFontColor(estFg).setFontWeight('bold').setHorizontalAlignment('center');
}


// ── Recalcular marcaciones (mes/año opcionales para filtrar y acelerar) ───────
function recalcularMarcaciones(filtroMes, filtroAnio) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var wsMar = ss.getSheetByName('Marcaciones');
    var wsHor = ss.getSheetByName('HorarioDetalle');
    if (!wsMar) return {ok:false, error:'No existe hoja Marcaciones'};
    var lastRow = wsMar.getLastRow();
    if (lastRow < 2) return {ok:true, procesadas:0};

    var horData = wsHor ? wsHor.getDataRange().getValues() : [];
    // Leer todo de una sola vez (más rápido que getRange por fila)
    var datos = wsMar.getRange(2,1,lastRow-1,18).getValues();

    // Aplicar formato de texto solo a las filas del mes filtrado (o todo)
    wsMar.getRange(2,3,lastRow-1,1).setNumberFormat('@STRING@');
    wsMar.getRange(2,6,lastRow-1,1).setNumberFormat('@STRING@');
    wsMar.getRange(2,7,lastRow-1,1).setNumberFormat('@STRING@');
    wsMar.getRange(2,8,lastRow-1,1).setNumberFormat('@STRING@');
    wsMar.getRange(2,9,lastRow-1,1).setNumberFormat('@STRING@');

    var procesadas = 0;
    var saltadas   = 0;

    for (var i = 0; i < datos.length; i++) {
      var fila = i + 2;
      var f = datos[i];

      // FILTRO: si viene mes/año, saltar filas que no correspondan
      if (filtroMes && filtroAnio) {
        var fechaVal = f[2];
        var fechaStr = toFechaStr(fechaVal); // 'YYYY-MM-DD'
        if (!fechaStr || fechaStr.substring(0,4)!==String(filtroAnio) ||
            fechaStr.substring(5,7)!==String(filtroMes)) {
          saltadas++;
          continue;
        }
      }
      if (!f[0]) continue;
      var empId   = String(f[0]);
      var fecha   = toFechaStr(f[2]);
      var dia     = String(f[3]);
      var entTexto= toHoraStr(f[5]);
      var sAlmT   = toHoraStr(f[6]);
      var rAlmT   = toHoraStr(f[7]);
      var salTexto= toHoraStr(f[8]);
      var estado  = String(f[13]||'Valida');

      if (fecha)    wsMar.getRange(fila,3).setNumberFormat('@STRING@').setValue(fecha);
      if (entTexto) wsMar.getRange(fila,6).setNumberFormat('@STRING@').setValue(entTexto);
      if (sAlmT)    wsMar.getRange(fila,7).setNumberFormat('@STRING@').setValue(sAlmT);
      if (rAlmT)    wsMar.getRange(fila,8).setNumberFormat('@STRING@').setValue(rAlmT);
      if (salTexto) wsMar.getRange(fila,9).setNumberFormat('@STRING@').setValue(salTexto);

      if (entTexto && salTexto) {
        var hEnt  = getHorasDecimal(entTexto);
        var hSal  = getHorasDecimal(salTexto);
        var hSAlm = getHorasDecimal(sAlmT);
        var hRAlm = getHorasDecimal(rAlmT);
        if (hEnt !== null && hSal !== null) {
          // Bug 1 fix: Almuerzo solo si AMBOS registros existen, nunca asumir 1h
          var alm   = (hSAlm!==null&&hRAlm!==null)?Math.max(0,hRAlm-hSAlm):0;
          var hTrab = redondear(Math.max(0,hSal-hEnt-alm),2);
          var hTrabOrdinarias = Math.min(hTrab, 9);
          // Bug 2 fix: Recargo nocturno = 1h fija si sale después de 19:00, nunca proporcional
          var noct  = (hSal>19)?1.0:0;
          var esDom = (dia==='Domingo'), esFest=(FESTIVOS.indexOf(fecha)!==-1);
          var dom   = (esDom||esFest)?hTrabOrdinarias:0;
          wsMar.getRange(fila,10).setValue(hTrab).setNumberFormat('0.00');
          wsMar.getRange(fila,11).setValue(noct).setNumberFormat('0.0');
          wsMar.getRange(fila,12).setValue(dom).setNumberFormat('0.0');
          // Bug 3 fix: Horas extra = 0 en recalculo, no se detectan por jornada diaria
          // Solo se crean en guardarMarcacion cuando hay autorización Y semana > 42h
          // No sobreescribir si ya tiene un valor autorizado guardado
          var extraActual=parseFloat(f[12])||0;
          if(extraActual===0) wsMar.getRange(fila,13).setValue(0).setNumberFormat('0.0');
          procesadas++;
        }
      }
      aplicarFormato(wsMar,fila,
        parseFloat(wsMar.getRange(fila,11).getValue())||0,
        parseFloat(wsMar.getRange(fila,12).getValue())||0,
        parseFloat(wsMar.getRange(fila,13).getValue())||0,
        estado);
    }
    return {ok:true, procesadas:procesadas, total:lastRow-1, saltadas:saltadas};
  } catch(e) { return {ok:false, error:e.message}; }
}

function getHorasProgConCod(horData, empId, dia, codH) {
  return getHorasProgConCodInfo(horData, empId, dia, codH).horas;
}

function getHorasProgConCodInfo(horData, empId, dia, codH) {
  for (var i=1;i<horData.length;i++) {
    if (String(horData[i][1])===empId && String(horData[i][3])===dia &&
        (codH==='' || String(horData[i][5])===codH))
      return {horas:parseFloat(horData[i][10])||8, horaExtra:parseFloat(horData[i][12])||0};
  }
  for (var i=1;i<horData.length;i++) {
    if (String(horData[i][1])===empId && String(horData[i][3])===dia)
      return {horas:parseFloat(horData[i][10])||8, horaExtra:parseFloat(horData[i][12])||0};
  }
  return {horas:8, horaExtra:0};
}

// =====================================================================
//  MODULO AUTORIZACIONES EXTRA
// =====================================================================

function getAutorizacionesExtra(empId, fecha) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('AutorizacionesExtra');
    if(!ws) return [];
    var rows=ws.getDataRange().getValues();
    var hoy=fecha?parseFecha(fecha):new Date();
    var r=[];
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(!f[0]) continue;
      if(String(f[9])==='Vencida') continue;
      if(empId&&String(f[1])!==empId) continue;
      // Check if fecha is within range
      if(fecha){
        var ini=parseFecha(toFechaStr(f[4]));
        var fin=parseFecha(toFechaStr(f[5]));
        fin.setHours(23,59,59);
        if(hoy<ini||hoy>fin) continue;
      }
      r.push({
        id:String(f[0]),empId:String(f[1]),nombre:String(f[2]),
        codHorario:String(f[3]),fechaInicio:toFechaStr(f[4]),
        fechaFin:toFechaStr(f[5]),tipo:String(f[6]),
        horasAutorizadas:parseFloat(f[7])||0,
        observacion:String(f[8]||''),estado:String(f[9]||'Activa'),
        aprobadoPor:String(f[10]||''),fila:i+1
      });
    }
    return r;
  } catch(e){return [{error:e.message}];}
}

function guardarAutorizacionExtra(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('AutorizacionesExtra');
    if(!ws) return {ok:false,error:'No existe hoja AutorizacionesExtra. Ejecuta setupCompleto primero.'};
    var ahora=new Date();
    var id='AE'+Utilities.formatDate(ahora,TZ,'yyyyMMddHHmmss');
    ws.appendRow([id,d.empId,d.empNom,d.codHorario,
                  d.fechaInicio,d.fechaFin,d.tipo,
                  d.horasAutorizadas||1,d.observacion||'',
                  'Activa',d.aprobadoPor||'Admin']);
    var lr=ws.getLastRow();
    ws.getRange(lr,1,1,11).setFontSize(10).setVerticalAlignment('middle')
      .setBackground(d.tipo==='Entrada'?'#E3F2FD':'#F3E5F5')
      .setBorder(true,true,true,true,true,true,'#B0C4D8',SpreadsheetApp.BorderStyle.SOLID);
    ws.setRowHeight(lr,22);
    ws.getRange(lr,10).setBackground('#E8F5E9').setFontColor('#2E7D32')
      .setFontWeight('bold').setHorizontalAlignment('center');
    return {ok:true,id:id};
  } catch(e){return {ok:false,error:e.message};}
}

function cancelarAutorizacionExtra(d) {
  try {
    var ss=SpreadsheetApp.openById(SHEET_ID);
    var ws=ss.getSheetByName('AutorizacionesExtra');
    if(!ws) return {ok:false,error:'No existe hoja AutorizacionesExtra'};
    var rows=ws.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(rows[i][0])===d.autId){
        ws.getRange(i+1,10).setValue('Cancelada')
          .setBackground('#F5F5F5').setFontColor('#9E9E9E')
          .setFontWeight('bold').setHorizontalAlignment('center');
        return {ok:true};
      }
    }
    return {ok:false,error:'No encontrada'};
  } catch(e){return {ok:false,error:e.message};}
}

// Buscar autorizacion activa para un empleado en una fecha
function getAutActiva(ss, empId, fecha) {
  try {
    var ws=ss.getSheetByName('AutorizacionesExtra');
    if(!ws) return null;
    var rows=ws.getDataRange().getValues();
    var hoy=parseFecha(fecha);
    for(var i=1;i<rows.length;i++){
      var f=rows[i]; if(!f[0]) continue;
      if(String(f[1])!==empId) continue;
      if(String(f[9])==='Cancelada'||String(f[9])==='Vencida') continue;
      var ini=parseFecha(toFechaStr(f[4]));
      var fin=parseFecha(toFechaStr(f[5]));
      fin.setHours(23,59,59);
      if(hoy>=ini&&hoy<=fin){
        return {tipo:String(f[6]),horas:parseFloat(f[7])||0,codHorario:String(f[3])};
      }
    }
  } catch(e){}
  return null;
}


// ── POST: Editar Contrato existente ──────────────────────────────────
function editarContrato(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Contratos');
    if (!ws) return {ok:false, error:'No existe hoja Contratos'};
    var rows = ws.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === d.contratoId) {
        var fila = i + 1;
        // Editar todos los campos excepto periodoP (col 14) si cambia de fijo a indefinido
        ws.getRange(fila,4).setValue(d.tipo||rows[i][3]);
        ws.getRange(fila,5).setValue(d.fechaInicio||rows[i][4]);
        ws.getRange(fila,6).setValue(d.fechaFin||rows[i][5]);
        ws.getRange(fila,7).setValue(d.duracionMeses||rows[i][6]);
        ws.getRange(fila,8).setValue(d.salario||rows[i][7]);
        ws.getRange(fila,9).setValue(d.cargo||rows[i][8]);
        ws.getRange(fila,13).setValue(d.observacion!==undefined?d.observacion:rows[i][12]);
        if(d.fechaNacimiento!==undefined) ws.getRange(fila,15).setValue(d.fechaNacimiento);
        if(d.regimen!==undefined) ws.getRange(fila,16).setValue(d.regimen);
        // Actualizar cargo en Empleados si cambio
        if (d.cargo && d.cargo !== String(rows[i][8])) {
          var wsEmp = ss.getSheetByName('Empleados');
          if (wsEmp) {
            var empRows = wsEmp.getDataRange().getValues();
            for (var j = 1; j < empRows.length; j++) {
              if (String(empRows[j][0]) === String(rows[i][1])) {
                wsEmp.getRange(j+1,6).setValue(d.cargo);
                break;
              }
            }
          }
        }
        return {ok:true, contratoId:d.contratoId};
      }
    }
    return {ok:false, error:'Contrato no encontrado'};
  } catch(e) { return {ok:false, error:e.message}; }
}

// ── POST: Retirar empleado desde contrato ────────────────────────────
function retirarDesdeContrato(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ahora = new Date();
    var fechaHoy = d.fechaRetiro || Utilities.formatDate(ahora, TZ, 'dd/MM/yyyy');

    // 1. Cerrar contrato
    var wsC = ss.getSheetByName('Contratos');
    if (wsC) {
      var cRows = wsC.getDataRange().getValues();
      for (var i = 1; i < cRows.length; i++) {
        if (String(cRows[i][1]) === d.empId && String(cRows[i][9]) === 'Activo') {
          wsC.getRange(i+1,9).setValue('Retirado')
            .setBackground('#F5F5F5').setFontColor('#9E9E9E')
            .setFontWeight('bold').setHorizontalAlignment('center');
        }
      }
    }

    // 2. Desactivar empleado
    var wsE = ss.getSheetByName('Empleados');
    if (wsE) {
      var eRows = wsE.getDataRange().getValues();
      for (var i = 1; i < eRows.length; i++) {
        if (String(eRows[i][0]) === d.empId) {
          wsE.getRange(i+1,12).setValue('NO')
            .setBackground('#F5F5F5').setFontColor('#9E9E9E');
          wsE.getRange(i+1,13).setValue('Retirado')
            .setBackground('#F5F5F5').setFontColor('#9E9E9E')
            .setFontWeight('bold').setHorizontalAlignment('center');
          wsE.getRange(i+1,14).setValue(fechaHoy);
          wsE.getRange(i+1,15).setValue(d.motivo||'Terminacion de contrato');
          break;
        }
      }
    }

    // 3. Marcar HorarioDetalle como inactivo
    var wsH = ss.getSheetByName('HorarioDetalle');
    if (wsH) {
      var hRows = wsH.getDataRange().getValues();
      for (var i = 1; i < hRows.length; i++) {
        if (String(hRows[i][1]) === d.empId) {
          wsH.getRange(i+1,12).setValue('NO')
            .setBackground('#F5F5F5').setFontColor('#9E9E9E');
        }
      }
    }

    return {ok:true, empId:d.empId, estado:'Retirado'};
  } catch(e) { return {ok:false, error:e.message}; }
}

// ── GET: Cumpleaños de todos los empleados ────────────────────────────
function getCumpleanios() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Contratos');
    if (!ws) return [];
    var rows = ws.getDataRange().getValues();
    var hoy = new Date();
    var r = [];
    var vistos = {};
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i];
      if (!f[0] || !f[14]) continue;
      if (vistos[String(f[1])]) continue; // solo primer contrato por empleado
      if (String(f[9]) === 'Retirado' || String(f[9]) === 'Terminado') continue;
      var fnStr = toFechaStr(f[14]);
      if (!fnStr) continue;
      var fn = parseFecha(fnStr);
      // Proxima fecha de cumpleanos este año
      var proxCump = new Date(hoy.getFullYear(), fn.getMonth(), fn.getDate());
      if (proxCump < hoy) proxCump.setFullYear(hoy.getFullYear() + 1);
      var diasR = Math.round((proxCump - hoy) / (1000*60*60*24));
      var edad = hoy.getFullYear() - fn.getFullYear();
      if (proxCump.getFullYear() > hoy.getFullYear()) edad--; // aun no ha cumplido
      r.push({
        empId: String(f[1]), nombre: String(f[2]),
        fechaNacimiento: fnStr, edad: edad,
        diasParaCumplir: diasR,
        cumpleHoy: diasR === 0,
        cumpleEstaSemana: diasR <= 7,
        cumpleEsteMes: diasR <= 30
      });
      vistos[String(f[1])] = true;
    }
    // Ordenar por dias restantes
    r.sort(function(a,b){ return a.diasParaCumplir - b.diasParaCumplir; });
    return r;
  } catch(e) { return [{error:e.message}]; }
}



// ── POST: Editar registro de vacaciones ──────────────────────────────
function editarVacacion(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Vacaciones');
    if (!ws) return {ok:false, error:'No existe hoja Vacaciones'};
    var rows = ws.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === d.vacId) {
        var fila = i + 1;
        if (d.fechaInicio) ws.getRange(fila,5).setValue(d.fechaInicio);
        if (d.fechaFin)    ws.getRange(fila,6).setValue(d.fechaFin);
        if (d.diasHabiles!==undefined) {
          ws.getRange(fila,7).setValue(d.diasHabiles);
          ws.getRange(fila,8).setValue(d.diasHabiles);
        }
        if (d.modalidad)   ws.getRange(fila,13).setValue(d.modalidad);
        if (d.observacion!==undefined) ws.getRange(fila,12).setValue(d.observacion);
        return {ok:true, vacId:d.vacId};
      }
    }
    return {ok:false, error:'Vacacion no encontrada'};
  } catch(e) { return {ok:false, error:e.message}; }
}

// ── POST: Eliminar/cancelar registro de vacaciones ───────────────────
function eliminarVacacion(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Vacaciones');
    if (!ws) return {ok:false, error:'No existe hoja Vacaciones'};
    var rows = ws.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === d.vacId) {
        ws.getRange(i+1,11).setValue('Cancelada')
          .setBackground('#F5F5F5').setFontColor('#9E9E9E')
          .setFontWeight('bold').setHorizontalAlignment('center');
        return {ok:true, vacId:d.vacId};
      }
    }
    return {ok:false, error:'Vacacion no encontrada'};
  } catch(e) { return {ok:false, error:e.message}; }
}
function agregarColumnaModalidadVacaciones() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var ws = ss.getSheetByName('Vacaciones');
  if (!ws) return;
  var lastCol = ws.getLastColumn();
  var headers = ws.getRange(1,1,1,lastCol).getValues()[0];
  var tiene = headers.some(function(h){return String(h).toLowerCase().indexOf('modalidad')!==-1;});
  if (!tiene) {
    ws.getRange(1,13).setValue('Modalidad')
      .setBackground('#2E7D32').setFontColor('#fff').setFontWeight('bold')
      .setFontSize(10).setHorizontalAlignment('center');
    ws.setColumnWidth(13,100);
    // Llenar Disfrutadas para filas existentes
    var lr = ws.getLastRow();
    if (lr > 1) ws.getRange(2,13,lr-1,1).setValue('Disfrutadas');
    Logger.log('Columna Modalidad agregada a Vacaciones');
  }
}
function agregarFechaNacimientoContratos() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var ws = ss.getSheetByName('Contratos');
  if (!ws) return;
  var lastCol = ws.getLastColumn();
  var headers = ws.getRange(1,1,1,lastCol).getValues()[0];
  var tieneFN = headers.some(function(h){return String(h).toLowerCase().indexOf('nacimiento')!==-1;});
  if (!tieneFN) {
    ws.getRange(1,15).setValue('FechaNacimiento')
      .setBackground('#1565C0').setFontColor('#fff').setFontWeight('bold')
      .setFontSize(10).setHorizontalAlignment('center');
    ws.setColumnWidth(15,100);
    Logger.log('Columna FechaNacimiento agregada a Contratos en col 15');
  } else {
    Logger.log('FechaNacimiento ya existe');
  }
}
function setupAutorizacionesExtra() {
  var ss=SpreadsheetApp.openById(SHEET_ID);
  var h=ss.getSheetByName('AutorizacionesExtra');
  if(h){Logger.log('AutorizacionesExtra ya existe');return;}
  h=ss.insertSheet('AutorizacionesExtra');
  h.setTabColor('#E91E63');
  var headers=['AutorizID','EmpleadoID','NombreEmpleado','CodHorario',
    'FechaInicio','FechaFin','Tipo','HorasAutorizadas',
    'Observacion','Estado','AprobadoPor'];
  h.getRange(1,1,1,headers.length).setValues([headers])
   .setBackground('#E91E63').setFontColor('#fff').setFontWeight('bold')
   .setFontSize(10).setHorizontalAlignment('center').setVerticalAlignment('middle');
  h.setRowHeight(1,28);
  h.setColumnWidth(1,140);h.setColumnWidth(3,160);
  h.setColumnWidth(5,90);h.setColumnWidth(6,90);
  h.setColumnWidth(7,90);h.setColumnWidth(9,200);
  h.setFrozenRows(1);
  Logger.log('Hoja AutorizacionesExtra creada');
}
function saveFoto(b64, nombre) {
  try {
    if (!b64 || b64.length < 100) {
      Logger.log('[saveFoto] foto vacía o muy corta: ' + (b64 ? b64.length : 0) + ' chars');
      return '';
    }
    var data = b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    if (!data || data.length < 50) {
      Logger.log('[saveFoto] base64 inválido después de limpiar prefijo');
      return '';
    }
    Logger.log('[saveFoto] procesando foto: ' + data.length + ' chars base64, nombre: ' + nombre);
    var blob = Utilities.newBlob(Utilities.base64Decode(data), 'image/jpeg', (nombre || 'foto') + '.jpg');
    Logger.log('[saveFoto] blob creado: ' + blob.getBytes().length + ' bytes');
    var carpeta;
    var iter = DriveApp.getFoldersByName('ALO_Fotos');
    if (iter.hasNext()) {
      carpeta = iter.next();
    } else {
      carpeta = DriveApp.createFolder('ALO_Fotos');
      Logger.log('[saveFoto] Carpeta ALO_Fotos creada');
    }
    var archivo = carpeta.createFile(blob);
    archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = archivo.getUrl();
    Logger.log('[saveFoto] ✅ Foto guardada: ' + url);
    return url;
  } catch (e) {
    Logger.log('[saveFoto] ❌ ERROR: ' + e.message + ' | Stack: ' + e.stack);
    return '';
  }
}

// =====================================================================
//  MODULO CONTRATOS v2 - Prorrogas, Preavisos, Vacaciones
// =====================================================================

// ── GET: Contratos con calculo de vacaciones ──────────────────────────
function getContratos(empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Contratos');
    if (!ws) return [];
    var wsVac = ss.getSheetByName('Vacaciones');
    var vacRows = wsVac ? wsVac.getDataRange().getValues() : [];

    var rows = ws.getDataRange().getValues();
    var r = [];
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      if (empId && String(f[1]) !== empId) continue;

      // Calcular vacaciones y antigüedad
      var fechaIni = toFechaStr(f[4]);
      var diasTrabajados = 0;
      var antiguedadAnios = 0, antiguedadMeses = 0;
      if (fechaIni) {
        var ini = parseFecha(fechaIni);
        var hoy = new Date();
        diasTrabajados = Math.max(0, Math.floor((hoy - ini) / (1000*60*60*24)));
        antiguedadAnios = Math.floor(diasTrabajados / 365);
        antiguedadMeses = Math.floor((diasTrabajados % 365) / 30);
      }
      var vacDisponibles = Math.floor(diasTrabajados / 365 * 15);
      // Periodo de prueba: dias restantes
      var diasPrueba = null;
      var periodoVigente = false;
      var periodoP = toFechaStr(f[13])||'';
      if (periodoP) {
        var finP = parseFecha(periodoP);
        diasPrueba = Math.round((finP - new Date()) / (1000*60*60*24));
        periodoVigente = diasPrueba > 0;
      }

      // Sumar dias por modalidad
      var vacTomados = 0, vacCompensadas = 0;
      for (var j = 1; j < vacRows.length; j++) {
        if (String(vacRows[j][1]) === String(f[1]) &&
            String(vacRows[j][3]) === String(f[0]) &&
            String(vacRows[j][10]) !== 'Cancelada') {
          var dias = parseFloat(vacRows[j][7]) || 0;
          if (String(vacRows[j][12]) === 'Compensadas') vacCompensadas += dias;
          else vacTomados += dias;
        }
      }
      var vacPendientes = Math.max(0, vacDisponibles - vacTomados - vacCompensadas);

      r.push({
        id: String(f[0]), empId: String(f[1]), nombre: String(f[2]),
        tipo: String(f[3]), fechaInicio: toFechaStr(f[4]),
        fechaFin: toFechaStr(f[5]), duracionMeses: f[6]||0,
        salario: f[7]||0, cargo: String(f[8]||''),
        estado: String(f[9]||'Activo'), numProrroga: f[10]||0,
        contratoOriginal: String(f[11]||''),
        observacion: String(f[12]||''),
        periodoP: periodoP,
        diasPrueba: diasPrueba,
        periodoVigente: periodoVigente,
        fechaNacimiento: toFechaStr(f[14])||'',
        regimen: String(f[15]||'Ley2466'),
        diasLey2466: parseFloat(f[16])||0,
        antiguedadAnios: antiguedadAnios,
        antiguedadMeses: antiguedadMeses,
        diasTrabajados: diasTrabajados,
        vacDisponibles: vacDisponibles, vacTomados: vacTomados, vacCompensadas: vacCompensadas,
        vacPendientes: vacPendientes, diasTrabajados: diasTrabajados,
        fila: i+1
      });
    }
    return r;
  } catch(e) { return [{error: e.message}]; }
}

// ── GET: Alertas contratos (35 dias) ─────────────────────────────────
function getAlertasContratos() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Contratos');
    if (!ws) return [];
    var wsPre = ss.getSheetByName('Preavisos');
    var preRows = wsPre ? wsPre.getDataRange().getValues() : [];

    var hoy = new Date();
    var rows = ws.getDataRange().getValues();
    var r = [];

    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      if (String(f[9]) === 'Terminado' || String(f[9]) === 'Retirado') continue;
      if (String(f[3]) === 'Indefinido') continue;
      var fechaFin = toFechaStr(f[5]);
      if (!fechaFin) continue;
      var fin = parseFecha(fechaFin);
      var diasR = Math.round((fin - hoy) / (1000*60*60*24));
      if (diasR > 35) continue;

      // Verificar si ya se registró preaviso
      var preRegistrado = false;
      for (var j = 1; j < preRows.length; j++) {
        if (String(preRows[j][1]) === String(f[0]) &&
            String(preRows[j][9]) === 'Notificado') {
          preRegistrado = true; break;
        }
      }

      var nivel = diasR <= 0 ? 'vencido' : diasR <= 15 ? 'critico' : 'proximo';
      r.push({
        id: String(f[0]), empId: String(f[1]), nombre: String(f[2]),
        tipo: String(f[3]), fechaFin: fechaFin,
        diasRestantes: diasR, nivel: nivel,
        salario: f[7]||0, cargo: String(f[8]||''),
        preRegistrado: preRegistrado
      });
    }
    r.sort(function(a,b){ return a.diasRestantes - b.diasRestantes; });
    return r;
  } catch(e) { return [{error: e.message}]; }
}

// ── GET: Preavisos ────────────────────────────────────────────────────
function getPreavisos(empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Preavisos');
    if (!ws) return [];
    var rows = ws.getDataRange().getValues();
    var r = [];
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      if (empId && String(f[2]) !== empId) continue;
      r.push({
        id: String(f[0]), contratoId: String(f[1]),
        empId: String(f[2]), nombre: String(f[3]),
        fechaVenc: toFechaStr(f[4]), diasRestantes: f[5]||0,
        fechaAlerta: toFechaStr(f[6]), fechaNot: toFechaStr(f[7]),
        notificadoPor: String(f[8]||''), estado: String(f[9]||'Pendiente'),
        observacion: String(f[10]||''), fila: i+1
      });
    }
    return r;
  } catch(e) { return [{error: e.message}]; }
}

// ── GET: Vacaciones ───────────────────────────────────────────────────
function getVacaciones(empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Vacaciones');
    if (!ws) return [];
    var rows = ws.getDataRange().getValues();
    var r = [];
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      if (empId && String(f[1]) !== empId) continue;
      r.push({
        id: String(f[0]), empId: String(f[1]), nombre: String(f[2]),
        contratoId: String(f[3]), fechaInicio: toFechaStr(f[4]),
        fechaFin: toFechaStr(f[5]), diasCalendario: f[6]||0,
        diasTomados: f[7]||0, fechaReg: toFechaStr(f[8]),
        aprobadoPor: String(f[9]||''), estado: String(f[10]||'Activa'),
        observacion: String(f[11]||''), fila: i+1
      });
    }
    return r;
  } catch(e) { return [{error: e.message}]; }
}

// ── POST: Guardar Contrato ────────────────────────────────────────────
function guardarContrato(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Contratos');
    if (!ws) return {ok:false, error:'No existe hoja Contratos'};
    var ahora = new Date();
    var rows = ws.getDataRange().getValues();

    // Generar EmpID si es empleado nuevo
    var empId = d.empId || '';
    if (!empId) {
      var maxId = 0;
      for (var i = 1; i < rows.length; i++) {
        var eid = String(rows[i][1]||'');
        if (eid.startsWith('EMP')) {
          var n = parseInt(eid.replace('EMP',''));
          if (n > maxId) maxId = n;
        }
      }
      empId = 'EMP' + String(maxId + 1).padStart(3,'0');
    }

    // Cerrar contrato activo anterior del mismo empleado
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === empId && String(rows[i][12]) === 'Activo') {
        ws.getRange(i+1, 13).setValue('Terminado');
      }
    }

    // Generar ID contrato
    var ctId = 'CT' + Utilities.formatDate(ahora, TZ, 'yyyyMMddHHmmss');
    var fechaHoy = Utilities.formatDate(ahora, TZ, 'dd/MM/yyyy');

    // Calcular fin período de prueba (solo primer contrato término fijo)
    var esPrimero = !rows.slice(1).some(function(r){ return String(r[1])===empId; });
    var finPrueba = '';
    if (esPrimero && d.tipo === 'Termino fijo' && d.duracion) {
      var diasPrueba = Math.round(parseInt(d.duracion) * 30 / 5);
      var iniDate = parseFecha(d.fechaInicio);
      iniDate.setDate(iniDate.getDate() + diasPrueba);
      finPrueba = Utilities.formatDate(iniDate, TZ, 'dd/MM/yyyy');
    }

    var regimen = d.regimen || 'Ley2466';
    var newRow = [
      ctId, empId, d.nombre||'', d.tipo||'Termino fijo',
      d.fechaInicio||fechaHoy, d.fechaFin||'', parseInt(d.duracion)||6,
      parseFloat(d.salario)||0, d.cargo||'', 15, 0, 15,
      'Activo', finPrueba, d.fechaNacimiento||'', regimen, 0, ''
    ];
    ws.appendRow(newRow);

    // Crear filas en HorarioDetalle si es empleado nuevo
    if (!d.empId) {
      var wsHor = ss.getSheetByName('HorarioDetalle');
      if (wsHor) {
        var dias=[['Lunes','L'],['Martes','M'],['Miercoles','Mi'],
                  ['Jueves','J'],['Viernes','V'],['Sabado','S']];
        var lastHorId = wsHor.getLastRow();
        dias.forEach(function(dia,idx){
          wsHor.appendRow(['HD'+String(lastHorId+idx+1).padStart(3,'0'),
            empId, d.nombre||'', dia[0], dia[1], '','','','','',0,'SI','']);
        });
      }
    }

    return {ok:true, contratoId:ctId, empId:empId, nuevo:!d.empId};
  } catch(e){return {ok:false, error:e.message};}
}

function renovarContrato(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Contratos');
    if (!ws) return {ok:false, error:'No existe hoja Contratos'};
    var rows = ws.getDataRange().getValues();
    var numPro = 0;
    var contratoOrigId = d.contratoId;
    // Buscar contrato original y numero de prorroga
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === d.contratoId) {
        // Cerrar este contrato
        ws.getRange(i+1, 10).setValue('Terminado')
          .setBackground('#F5F5F5').setFontColor('#9E9E9E')
          .setFontWeight('bold').setHorizontalAlignment('center');
        numPro = (parseFloat(rows[i][10])||0) + 1;
        contratoOrigId = String(rows[i][11])||String(rows[i][0]);
        break;
      }
    }
    // Crear nueva prorroga
    var ahora = new Date();
    var id = 'CT' + Utilities.formatDate(ahora, TZ, 'yyyyMMddHHmmss');
    ws.appendRow([id, d.empId, d.empNom, d.tipo||'Termino fijo',
                  d.fechaInicio||'', d.fechaFin||'',
                  d.duracionMeses||0, d.salario||0, d.cargo||'',
                  'Activo', numPro, contratoOrigId,
                  'Prorroga #'+numPro+' de '+contratoOrigId]);
    var lr = ws.getLastRow();
    ws.getRange(lr,1,1,13).setFontSize(10).setVerticalAlignment('middle')
      .setBorder(true,true,true,true,true,true,'#B0C4D8',SpreadsheetApp.BorderStyle.SOLID);
    ws.setRowHeight(lr, 22);
    ws.getRange(lr,10).setBackground('#E8F5E9').setFontColor('#2E7D32')
      .setFontWeight('bold').setHorizontalAlignment('center');
    ws.getRange(lr,11).setBackground('#E3F2FD').setFontColor('#1565C0')
      .setFontWeight('bold').setHorizontalAlignment('center');
    return {ok:true, id:id, numProrroga:numPro};
  } catch(e) { return {ok:false, error:e.message}; }
}

// ── POST: Registrar Preaviso ──────────────────────────────────────────
function registrarPreaviso(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Preavisos');
    if (!ws) return {ok:false, error:'No existe hoja Preavisos'};
    var ahora = new Date();
    var fechaHoy = Utilities.formatDate(ahora, TZ, 'dd/MM/yyyy');
    var id = 'PRE' + Utilities.formatDate(ahora, TZ, 'yyyyMMddHHmmss');
    // Calcular dias restantes
    var diasR = 0;
    if (d.fechaVenc) {
      var fin = parseFecha(d.fechaVenc);
      diasR = Math.round((fin - ahora) / (1000*60*60*24));
    }
    ws.appendRow([id, d.contratoId, d.empId, d.empNom,
                  d.fechaVenc||'', diasR, fechaHoy,
                  fechaHoy, d.notificadoPor||'Admin',
                  'Notificado', d.observacion||'']);
    var lr = ws.getLastRow();
    ws.getRange(lr,1,1,11).setFontSize(10).setVerticalAlignment('middle')
      .setBackground('#FFF3E0')
      .setBorder(true,true,true,true,true,true,'#FFB74D',SpreadsheetApp.BorderStyle.SOLID);
    ws.setRowHeight(lr, 22);
    ws.getRange(lr,10).setBackground('#E8F5E9').setFontColor('#2E7D32')
      .setFontWeight('bold').setHorizontalAlignment('center');
    return {ok:true, id:id, diasRestantes:diasR};
  } catch(e) { return {ok:false, error:e.message}; }
}

// ── POST: Registrar Vacaciones ────────────────────────────────────────
function registrarVacaciones(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Vacaciones');
    if (!ws) return {ok:false, error:'No existe hoja Vacaciones'};
    var ahora = new Date();
    var fechaHoy = Utilities.formatDate(ahora, TZ, 'dd/MM/yyyy');
    var id = 'VAC' + Utilities.formatDate(ahora, TZ, 'yyyyMMddHHmmss');
    // Calcular dias HABILES (Lun-Sab, sin festivos)
    var diasCal = 0;
    if (d.fechaInicio && d.fechaFin && modalidad !== 'Compensadas') {
      var ini = parseFecha(d.fechaInicio);
      var fin = parseFecha(d.fechaFin);
      var cur = new Date(ini.getTime());
      while (cur <= fin) {
        var dow = cur.getDay(); // 0=Dom, 6=Sab
        var fStr = Utilities.formatDate(cur, TZ, 'dd/MM/yyyy');
        var esDom = (dow === 0);
        var esFest = (FESTIVOS.indexOf(fStr) !== -1);
        if (!esDom && !esFest) diasCal++; // Lun-Sab sin festivos
        cur.setDate(cur.getDate() + 1);
      }
    } else if (modalidad === 'Compensadas' && d.diasCalendario) {
      diasCal = parseInt(d.diasCalendario) || 0;
    }
    ws.appendRow([id, d.empId, d.empNom, d.contratoId||'',
                  d.fechaInicio||'', d.fechaFin||'',
                  diasCal, diasCal,
                  fechaHoy, d.aprobadoPor||'Admin',
                  'Activa', d.observacion||'']);
    var lr = ws.getLastRow();
    ws.getRange(lr,1,1,12).setFontSize(10).setVerticalAlignment('middle')
      .setBackground('#E8F5E9')
      .setBorder(true,true,true,true,true,true,'#A5D6A7',SpreadsheetApp.BorderStyle.SOLID);
    ws.setRowHeight(lr, 22);
    ws.getRange(lr,11).setBackground('#E8F5E9').setFontColor('#2E7D32')
      .setFontWeight('bold').setHorizontalAlignment('center');
    return {ok:true, id:id, diasCalendario:diasCal};
  } catch(e) { return {ok:false, error:e.message}; }
}

// =====================================================================
//  MODULO CONTROL DIARIO
// =====================================================================

// ── GET: Control Diario por fecha ─────────────────────────────────────
function getControlDiario(fecha, empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('ControlDiario');
    if (!ws) return [];
    var rows = ws.getDataRange().getValues();
    var r = [];
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      var fFecha = toFechaStr(f[1]);
      if (fecha && fFecha !== fecha) continue;
      if (empId && String(f[3]) !== empId) continue;
      var horaCtrlStr = toHoraStr(f[12]);
      r.push({
        id:String(f[0]), fecha:fFecha, dia:String(f[2]),
        empId:String(f[3]), nombre:String(f[4]),
        camisa:String(f[5]||''), pantalon:String(f[6]||''),
        celular:String(f[7]||''), aseo:String(f[8]||''),
        radar:String(f[9]||''), observacion:String(f[10]||''),
        registradoPor:String(f[11]||''), hora:horaCtrlStr,
        fila:i+1
      });
    }
    return r;
  } catch(e) { return [{error:e.message}]; }
}

// ── GET: Resumen control por periodo ─────────────────────────────────
function getResumenControl(periodo) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('ControlDiario');
    if (!ws) return [];
    if (!periodo) {
      var ahora = new Date();
      periodo = Utilities.formatDate(ahora, TZ, 'MM/yyyy');
    }
    var p = periodo.split('/');
    var mes = parseInt(p[0]), anio = parseInt(p[1]);
    var rows = ws.getDataRange().getValues();
    var porEmp = {};
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      var fFecha = toFechaStr(f[1]); if (!fFecha) continue;
      var pf = fFecha.split('/');
      if (parseInt(pf[1]) !== mes || parseInt(pf[2]) !== anio) continue;
      var empId = String(f[3]);
      if (!porEmp[empId]) porEmp[empId] = {
        nombre:String(f[4]), dias:0,
        camisa:{si:0,no:0}, pantalon:{si:0,no:0},
        celular:{si:0,no:0}, aseo:{si:0,no:0,na:0}, radar:{si:0,no:0}
      };
      var e = porEmp[empId];
      e.dias++;
      function cnt(campo, val) {
        var v = String(val||'').toLowerCase();
        if (v==='si'||v==='sí') campo.si++;
        else if (v==='no') campo.no++;
        else if (campo.na !== undefined) campo.na++;
      }
      cnt(e.camisa, f[5]); cnt(e.pantalon, f[6]);
      cnt(e.celular, f[7]); cnt(e.aseo, f[8]); cnt(e.radar, f[9]);
    }
    var resultado = [];
    for (var empId in porEmp) {
      var e = porEmp[empId];
      resultado.push({
        empId:empId, nombre:e.nombre, dias:e.dias,
        camisa:e.camisa, pantalon:e.pantalon,
        celular:e.celular, aseo:e.aseo, radar:e.radar,
        pctCamisa: e.dias>0?Math.round(e.camisa.si/e.dias*100):0,
        pctPantalon: e.dias>0?Math.round(e.pantalon.si/e.dias*100):0,
        pctCelular: e.dias>0?Math.round(e.celular.si/e.dias*100):0,
        pctAseo: e.dias>0?Math.round(e.aseo.si/e.dias*100):0,
        pctRadar: e.dias>0?Math.round(e.radar.si/e.dias*100):0
      });
    }
    return resultado;
  } catch(e) { return [{error:e.message}]; }
}

// ── POST: Guardar Control Diario (batch - todos los empleados) ─────────
function guardarControlDiario(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('ControlDiario');
    if (!ws) return {ok:false, error:'No existe hoja ControlDiario. Ejecuta setupControlDiario primero.'};
    var ahora = new Date();
    var fecha = d.fecha || Utilities.formatDate(ahora, TZ, 'dd/MM/yyyy');
    var hora  = Utilities.formatDate(ahora, TZ, 'HH:mm');
    var dias  = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
    var dia   = dias[ahora.getDay()];
    var registros = d.registros || [];
    var guardados = 0;

    // Verificar si ya existe registro para este empleado hoy
    var existentes = ws.getDataRange().getValues();
    var existMap = {};
    for (var i = 1; i < existentes.length; i++) {
      var fFecha = toFechaStr(existentes[i][1]);
      if (fFecha === fecha) {
        existMap[String(existentes[i][3])] = i+1;
      }
    }

    registros.forEach(function(reg) {
      var filaExist = existMap[reg.empId];
      var id = 'CD'+Utilities.formatDate(ahora,TZ,'yyyyMMdd')+reg.empId;
      var rowData = [id, fecha, dia, reg.empId, reg.nombre,
                     reg.camisa||'', reg.pantalon||'', reg.celular||'',
                     reg.aseo||'', reg.radar||'', reg.observacion||'',
                     d.registradoPor||'Control', hora];
      if (filaExist) {
        // Actualizar fila existente
        ws.getRange(filaExist, 1, 1, 13).setValues([rowData]);
      } else {
        ws.appendRow(rowData);
        var lr = ws.getLastRow();
        ws.getRange(lr,1,1,13).setFontSize(10).setVerticalAlignment('middle')
          .setBorder(true,true,true,true,true,true,'#CE93D8',SpreadsheetApp.BorderStyle.SOLID);
        ws.setRowHeight(lr, 22);
      }
      // Formato colores Si/No
      var fila = filaExist || ws.getLastRow();
      [6,7,8,9,10].forEach(function(col, idx) {
        var vals = [reg.camisa, reg.pantalon, reg.celular, reg.aseo, reg.radar];
        var v = String(vals[idx]||'').toLowerCase();
        var bg = v==='si'||v==='sí'?'#E8F5E9':v==='no'?'#FFEBEE':'#F5F5F5';
        var fg = v==='si'||v==='sí'?'#2E7D32':v==='no'?'#C62828':'#9E9E9E';
        ws.getRange(fila, col).setBackground(bg).setFontColor(fg)
          .setFontWeight('bold').setHorizontalAlignment('center');
      });
      guardados++;
    });
    return {ok:true, guardados:guardados, fecha:fecha};
  } catch(e) { return {ok:false, error:e.message}; }
}

// =====================================================================
//  MODULO ASEO - v13
// =====================================================================

// ── GET: Horario de aseo por empleado/dia ────────────────────────────
// Devuelve las tareas de aseo asignadas segun el horario fijo
function getHorarioAseo(empId, dia) {
  // Horario fijo segun imagen compartida por el administrador
  var HORARIO_ASEO = {
    'Juliana Marcela Sanchez': { 'Lunes':'Organizar módulo caja', 'Miércoles':'Organizar módulo caja' },
    'Maryory Channel Salazar': { 'Martes':'Limpiar vidrios fachada y vitrinas', 'Miércoles':'Lavar canecas de basura y 5 trapos', 'Jueves':'Sacar basura del baño', 'Viernes':'Lavar baño', 'Sábado':'Aseo mañana local y escaleras' },
    'Brenda Carolina Lopez': { 'Lunes':'Sacar basura del baño', 'Martes':'Lavar baño', 'Jueves':'Sacar la basura', 'Viernes':'Barrer afuera', 'Sábado':'Aseo mañana local y escaleras' },
    'Juan Fernando Parra':   { 'Lunes':'Aseo mañana local y escaleras', 'Martes':'Barrer afuera', 'Miércoles':'Limpiar vidrios fachada y vitrinas', 'Sábado':'Aseo tarde local y escaleras' },
    'Luisa Fernanda Diaz':   { 'Lunes':'Barrer afuera', 'Martes':'Aseo mañana local y escaleras', 'Miércoles':'Sacar basura del baño', 'Jueves':'Lavar baño', 'Viernes':'Aseo tarde local y escaleras', 'Sábado':'Lavar el tanque y 5 trapos' },
    'Brayner Ernesto Botia': { 'Lunes':'Sacar la basura', 'Martes':'Barrer afuera', 'Miércoles':'Aseo mañana local y escaleras', 'Jueves':'Aseo tarde local y escaleras', 'Viernes':'Sacar la basura' },
    'Santiago Moscoso Muñoz':{ 'Martes':'Aseo tarde local y escaleras', 'Miércoles':'Sacar la basura', 'Jueves':'Aseo mañana local y escaleras', 'Viernes':'Sacar basura del baño', 'Sábado':'Barrer afuera' },
    'Juan Esteban Cepeda':   { 'Lunes':'Aseo tarde local y escaleras', 'Martes':'Sacar la basura', 'Jueves':'Barrer afuera', 'Viernes':'Aseo mañana local y escaleras', 'Sábado':'Sacar basura del baño' },
    'Juan Carlos Cepeda':    { 'Miércoles':'Aseo tarde local y escaleras', 'Sábado':'Sacar la basura' },
    'Silvia Alejandra Blanco':{ 'Lunes':'Lavar baño', 'Martes':'Lavar canecas de basura y 5 trapos' },
    'Camilo Alexander Alfonso':{ 'Lunes':'Lavar el tanque y 5 trapos', 'Miércoles':'Lavar baño', 'Viernes':'Lavar canecas de basura y 5 trapos' },
    'Fabián Stiven Mendoza':   {
      'Lunes':    ['Aseo servicio técnico mañana','Aseo servicio técnico tarde'],
      'Martes':   ['Aseo servicio técnico mañana','Aseo servicio técnico tarde'],
      'Miércoles':['Aseo servicio técnico mañana','Aseo servicio técnico tarde'],
      'Jueves':   ['Aseo servicio técnico mañana','Aseo servicio técnico tarde'],
      'Viernes':  ['Aseo servicio técnico mañana','Aseo servicio técnico tarde'],
      'Sábado':   ['Aseo servicio técnico mañana','Aseo servicio técnico tarde','Lavar baño']
    }
  };
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    // Intentar leer hoja de horario personalizado primero
    var ws = ss.getSheetByName('HorarioAseo');
    if (ws) {
      var rows = ws.getDataRange().getValues();
      var r = [];
      for (var i = 1; i < rows.length; i++) {
        var f = rows[i]; if (!f[0]) continue;
        if (empId && String(f[0]) !== empId) continue;
        if (dia && String(f[1]) !== dia) continue;
        r.push({empId:String(f[0]), dia:String(f[1]), tarea:String(f[2]||'')});
      }
      if (r.length > 0) return r;
    }
    // Fallback: buscar nombre del empleado en hoja Empleados y buscar en horario por nombre
    var shEmp = ss.getSheetByName('Empleados');
    var empNom = '';
    if (shEmp && empId) {
      var rowsE = shEmp.getDataRange().getValues();
      for (var re = 1; re < rowsE.length; re++) {
        if (String(rowsE[re][0]) === String(empId)) {
          empNom = String(rowsE[re][1]).toUpperCase();
          break;
        }
      }
    }
    // Buscar en horario por nombre completo, luego por primer nombre
    var horEmp = null;
    if (empNom) {
      horEmp = HORARIO_ASEO[empNom];
      if (!horEmp) {
        var nom1 = empNom.split(' ')[0];
        horEmp = HORARIO_ASEO[nom1];
      }
      if (!horEmp) {
        // Buscar nombre parcial
        for (var k in HORARIO_ASEO) {
          if (empNom.indexOf(k) !== -1 || k.indexOf(empNom.split(' ')[0]) !== -1) {
            horEmp = HORARIO_ASEO[k]; break;
          }
        }
      }
    }
    if (horEmp && dia) {
      var tareaVal = horEmp[dia];
      if (!tareaVal) return [{empId:empId, empNom:empNom, dia:dia, tarea:'Sin asignacion este dia'}];
      // Soporte para tareas múltiples (array) o tarea única (string)
      var tareaArr = Array.isArray(tareaVal) ? tareaVal : [tareaVal];
      return tareaArr.map(function(tarea){
        return {empId:empId, empNom:empNom, dia:dia, tarea:tarea};
      });
    }
    if (!empId) {
      // Devolver todo el horario
      var result = [];
      for (var eid in HORARIO_ASEO) {
        for (var d in HORARIO_ASEO[eid]) {
          if (dia && d !== dia) continue;
          var val = HORARIO_ASEO[eid][d];
          var arr = Array.isArray(val) ? val : [val];
          arr.forEach(function(tarea){ result.push({empId:eid, dia:d, tarea:tarea}); });
        }
      }
      return result;
    }
    return [{empId:empId, dia:dia, tarea:'Sin asignacion'}];
  } catch(e) { return [{error:e.message}]; }
}

// ── GET: Todo el horario de aseo (para vista admin tabla) ─────────────
function getAllHorarioAseo() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('HorarioAseo');
    if (!ws) return {ok:true, horario:[], fuente:'default'};
    var rows = ws.getDataRange().getValues();
    var r = [];
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      r.push({nombre:String(f[0]), dia:String(f[1]), tarea:String(f[2]||'')});
    }
    return {ok:true, horario:r, fuente:'sheets'};
  } catch(e) { return {ok:false, error:e.message, horario:[]}; }
}

// ── POST: Guardar horario de aseo completo ─────────────────────────────
function guardarHorarioAseo(d) {
  try {
    var payload = d.horario || [];
    if (!payload.length) return {ok:false, error:'Horario vacío'};
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('HorarioAseo');
    if (!ws) {
      ws = ss.insertSheet('HorarioAseo');
      ws.appendRow(['Nombre','Dia','Tarea']);
      ws.getRange(1,1,1,3).setFontWeight('bold').setBackground('#1E3A5F').setFontColor('#FFFFFF');
    }
    // Limpiar todo (excepto cabecera)
    var lr = ws.getLastRow();
    if (lr > 1) ws.getRange(2, 1, lr-1, ws.getLastColumn()).clearContent();
    // Escribir nuevo horario
    var datos = payload.map(function(p){ return [p.nombre||'', p.dia||'', p.tarea||'']; });
    if (datos.length) ws.getRange(2, 1, datos.length, 3).setValues(datos);
    return {ok:true, escritas:datos.length};
  } catch(e) { return {ok:false, error:e.message}; }
}

// ── GET: Registros de aseo ─────────────────────────────────────────────
function getAseos(fecha, empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Aseos');
    if (!ws) return [];
    var rows = ws.getDataRange().getValues();
    var r = [];
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      var fFecha = toFechaStr(f[2]);
      if (fecha && fFecha !== fecha) continue;
      if (empId && String(f[1]) !== empId) continue;
      // f[5] puede venir como Date (Sheets convierte HH:mm a Date 1899)
      // Usar toHoraStr que maneja Date y strings con "1899"
      var horaStr = toHoraStr(f[5]);
      var empNomVal = String(f[1]||'');
      // Si el nombre está vacío, intentar col B como ID
      if (!empNomVal || empNomVal==='undefined') empNomVal = String(f[1]||f[0]||'—');
      r.push({
        id:String(f[0]), empNom:empNomVal, fecha:fFecha,
        dia:String(f[3]), tarea:String(f[4]),
        hora:horaStr||'—', foto:String(f[6]||''),
        estado:String(f[7]||'Completado'), fila:i+1
      });
    }
    return r;
  } catch(e) { return [{error:e.message}]; }
}

// ── GET: Cumplimiento de aseo por periodo ──────────────────────────────
function getCumplimientoAseo(periodo) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Aseos');
    if (!ws) return [];
    if (!periodo) periodo = Utilities.formatDate(new Date(), TZ, 'MM/yyyy');
    var p = periodo.split('/');
    var mes = parseInt(p[0]), anio = parseInt(p[1]);
    var rows = ws.getDataRange().getValues();
    var porEmp = {};
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      var fFecha = toFechaStr(f[2]); if (!fFecha) continue;
      var pf = fFecha.split('/');
      if (parseInt(pf[1]) !== mes || parseInt(pf[2]) !== anio) continue;
      var eid = String(f[1]);
      if (!porEmp[eid]) porEmp[eid] = {nombre:String(f[1]), total:0, completados:0};
      porEmp[eid].total++;
      if (String(f[7]) === 'Completado') porEmp[eid].completados++;
    }
    var result = [];
    for (var eid in porEmp) {
      var e = porEmp[eid];
      result.push({
        empId:eid, nombre:e.nombre,
        total:e.total, completados:e.completados,
        pct: e.total>0 ? Math.round(e.completados/e.total*100) : 0
      });
    }
    return result;
  } catch(e) { return [{error:e.message}]; }
}

// ── POST: Guardar marcacion de aseo ───────────────────────────────────
function guardarAseo(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Aseos');
    if (!ws) {
      // Crear hoja si no existe
      ws = ss.insertSheet('Aseos');
      ws.setTabColor('#00BCD4');
      var hdrs = ['AseoID','EmpleadoNombre','Fecha','Dia','Tarea','Hora','Foto','Estado'];
      ws.getRange(1,1,1,hdrs.length).setValues([hdrs])
        .setBackground('#1E3A5F').setFontColor('#fff').setFontWeight('bold')
        .setFontSize(10).setHorizontalAlignment('center');
      ws.setFrozenRows(1);
    }
    var ahora = new Date();
    var hora = Utilities.formatDate(ahora, TZ, 'HH:mm');
    var fecha = Utilities.formatDate(ahora, TZ, 'dd/MM/yyyy');
    var dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    var dia = dias[ahora.getDay()];
    var id = 'ASE' + Utilities.formatDate(ahora, TZ, 'yyyyMMddHHmmss');
    var foto = (d.foto && d.foto.length > 100) ? saveFoto(d.foto, 'aseo_'+(d.empId||d.empNom||'emp')+'_'+fecha.replace(/\//g,'')) : '';
    var empNom = d.empNom || d.empId || '';

    // Verificar si ya existe registro hoy para esta tarea
    var rows = ws.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      // Buscar por nombre o por id (compatibilidad con registros viejos)
      var matchEmp = (String(rows[i][1]) === empNom || String(rows[i][1]) === d.empId);
      if (matchEmp && toFechaStr(rows[i][2]) === fecha && String(rows[i][4]) === d.tarea) {
        // Actualizar
        ws.getRange(i+1,2).setValue(empNom); // asegurar nombre correcto
        ws.getRange(i+1,6).setNumberFormat('@STRING@').setValue(hora); // texto, no Date
        if (foto) ws.getRange(i+1,7).setValue(foto);
        ws.getRange(i+1,8).setValue('Completado');
        return {ok:true, id:String(rows[i][0]), hora:hora, actualizado:true};
      }
    }

    // Escribir fila SIN hora primero para evitar que Sheets convierta "HH:mm" a Date 1899
    ws.appendRow([id, empNom, fecha, dia, d.tarea||'Aseo general', '', foto, 'Completado']);
    var lr = ws.getLastRow();
    // Primero formato texto, luego valor — orden importa
    ws.getRange(lr,6).setNumberFormat('@STRING@').setValue(hora);
    ws.getRange(lr,1,1,8).setFontSize(10).setVerticalAlignment('middle')
      .setBackground('#E0F7FA')
      .setBorder(true,true,true,true,true,true,'#00ACC1',SpreadsheetApp.BorderStyle.SOLID);
    ws.setRowHeight(lr, 22);
    ws.getRange(lr,8).setBackground('#E8F5E9').setFontColor('#2E7D32').setFontWeight('bold').setHorizontalAlignment('center');
    return {ok:true, id:id, hora:hora, fecha:fecha, tarea:d.tarea};
  } catch(e) { return {ok:false, error:e.message}; }
}

// =====================================================================
//  MODULO BREAKS - v13
// =====================================================================

// ── GET: Breaks por fecha/empleado ────────────────────────────────────
function getBreaks(fecha, empId) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Breaks');
    if (!ws) return [];
    var rows = ws.getDataRange().getValues();
    var r = [];
    for (var i = 1; i < rows.length; i++) {
      var f = rows[i]; if (!f[0]) continue;
      var fFecha = toFechaStr(f[2]);
      if (fecha && fFecha !== fecha) continue;
      if (empId && String(f[1]) !== empId) continue;
      // toHoraStr maneja Date 1899, strings con GMT, y strings normales HH:mm
      var hIni = toHoraStr(f[4]);
      var hFin = toHoraStr(f[5]);
      r.push({
        id:String(f[0]), empId:String(f[1]), fecha:fFecha,
        nombre:String(f[3]||''), horaInicio:hIni,
        horaFin:hFin, duracion:Number(f[6])||0,
        estado:String(f[7]||'En break'), fila:i+1
      });
    }
    return r;
  } catch(e) { return [{error:e.message}]; }
}

// ── POST: Iniciar/Finalizar Break ──────────────────────────────────────
function guardarBreak(d) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Breaks');
    if (!ws) {
      ws = ss.insertSheet('Breaks');
      ws.setTabColor('#FF9800');
      var hdrs = ['BreakID','EmpleadoID','Fecha','Nombre','HoraInicio','HoraFin','DuracionMin','Estado'];
      ws.getRange(1,1,1,hdrs.length).setValues([hdrs])
        .setBackground('#FF9800').setFontColor('#fff').setFontWeight('bold')
        .setFontSize(10).setHorizontalAlignment('center');
      ws.setFrozenRows(1);
    }
    var ahora = new Date();
    var hora = Utilities.formatDate(ahora, TZ, 'HH:mm');
    var fecha = Utilities.formatDate(ahora, TZ, 'dd/MM/yyyy');
    var id = 'BRK' + Utilities.formatDate(ahora, TZ, 'yyyyMMddHHmmss');

    // Limpiar TODAS las fórmulas en la columna Duracion (col 7) — fix #NUM!
    try {
      var lastRow = ws.getLastRow();
      if (lastRow > 1) {
        var durRange = ws.getRange(2, 7, lastRow - 1, 1);
        var durVals  = durRange.getFormulas();
        for (var fi = 0; fi < durVals.length; fi++) {
          if (durVals[fi][0] && durVals[fi][0] !== '') {
            ws.getRange(fi + 2, 7).clearContent().setNumberFormat('0').setValue(0);
            Logger.log('[guardarBreak] Limpiada fórmula en fila ' + (fi + 2));
          }
        }
      }
    } catch (cleanErr) {
      Logger.log('[guardarBreak] Error limpiando fórmulas: ' + cleanErr.message);
    }

    // Ver si ya tiene break iniciado hoy
    var rows = ws.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === d.empId && toFechaStr(rows[i][2]) === fecha && String(rows[i][7]) === 'En break') {
        if (d.accion === 'fin') {
          // toHoraStr maneja Date 1899, string GMT, y string normal
          var iniStr = toHoraStr(rows[i][4]);
          var p1 = iniStr.split(':');
          var p2 = hora.split(':');
          var dur = (parseInt(p2[0])*60+parseInt(p2[1])) - (parseInt(p1[0])*60+parseInt(p1[1]));
          // Primero formato texto en HoraFin, luego valor
          ws.getRange(i+1,6).setNumberFormat('@STRING@').setValue(hora);
          // Limpiar posible fórmula en DuracionMin (col 7) antes de poner el número
          ws.getRange(i+1,7).clearContent().setNumberFormat('0').setValue(Math.max(0,dur));
          ws.getRange(i+1,8).setValue('Completado');
          ws.getRange(i+1,8).setBackground('#E8F5E9').setFontColor('#2E7D32').setFontWeight('bold').setHorizontalAlignment('center');
          return {ok:true, accion:'fin', horaInicio:iniStr, horaFin:hora, duracion:Math.max(0,dur)};
        } else {
          var iniActivoStr = toHoraStr(rows[i][4]);
          return {ok:false, error:'Ya tienes un break activo desde '+iniActivoStr};
        }
      }
    }

    // Nuevo break
    if (d.accion === 'fin') return {ok:false, error:'No hay break activo para finalizar'};
    // Escribir fila SIN hora primero, luego aplicar formato texto y poner hora
    // Así Sheets no puede auto-convertir "HH:mm" a Date 1899
    ws.appendRow([id, d.empId, fecha, d.empNom||d.empId, '', '', 0, 'En break']);
    var lr = ws.getLastRow();
    // Limpiar col G por si hay fórmula arrastrada, poner 0 como número
    ws.getRange(lr,7).clearContent().setNumberFormat('0').setValue(0);
    // Primero formato texto en cols HoraInicio(5) y HoraFin(6), luego valor
    ws.getRange(lr,5).setNumberFormat('@STRING@').setValue(hora);
    ws.getRange(lr,6).setNumberFormat('@STRING@').setValue('');
    ws.getRange(lr,1,1,8).setFontSize(10).setVerticalAlignment('middle')
      .setBackground('#FFF8E1')
      .setBorder(true,true,true,true,true,true,'#FFB74D',SpreadsheetApp.BorderStyle.SOLID);
    ws.setRowHeight(lr, 22);
    ws.getRange(lr,8).setBackground('#FFF3E0').setFontColor('#E65100').setFontWeight('bold').setHorizontalAlignment('center');
    return {ok:true, accion:'inicio', horaInicio:hora, id:id};
  } catch(e) { return {ok:false, error:e.message}; }
}

// =====================================================================
//  SETUP: Crear hoja Aseos si no existe
//  Ejecutar UNA VEZ desde el editor de Apps Script: crearHojaAseos()
// =====================================================================
function crearHojaAseos() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var ws = ss.getSheetByName('Aseos');
  if (ws) {
    SpreadsheetApp.getUi().alert('La hoja Aseos ya existe.');
    return;
  }
  // Crear hoja al final
  ws = ss.insertSheet('Aseos');
  ws.setTabColor('#00BCD4');

  // Encabezados
  var hdrs = ['AseoID','EmpleadoNombre','Fecha','Dia','Tarea','Hora','Foto','Estado'];
  var hRange = ws.getRange(1,1,1,hdrs.length);
  hRange.setValues([hdrs]);
  hRange.setBackground('#1E3A5F')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setFontSize(10)
        .setHorizontalAlignment('center');
  ws.setFrozenRows(1);

  // Anchos de columna
  ws.setColumnWidth(1, 160); // AseoID
  ws.setColumnWidth(2, 180); // EmpleadoNombre
  ws.setColumnWidth(3, 100); // Fecha
  ws.setColumnWidth(4, 90);  // Dia
  ws.setColumnWidth(5, 260); // Tarea
  ws.setColumnWidth(6, 70);  // Hora
  ws.setColumnWidth(7, 200); // Foto (URL)
  ws.setColumnWidth(8, 100); // Estado

  Logger.log('✅ Hoja Aseos creada correctamente.');
  try { SpreadsheetApp.getUi().alert('✅ Hoja Aseos creada correctamente.'); } catch(e) {}
}

// =====================================================================
//  SETUP: Crear hoja Breaks si no existe
//  Ejecutar UNA VEZ desde el editor de Apps Script: crearHojaBreaks()
// =====================================================================
function crearHojaBreaks() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var ws = ss.getSheetByName('Breaks');
  if (ws) {
    try { SpreadsheetApp.getUi().alert('La hoja Breaks ya existe.'); } catch(e) {}
    return;
  }
  ws = ss.insertSheet('Breaks');
  ws.setTabColor('#FF9800');

  var hdrs = ['BreakID','EmpleadoID','Fecha','EmpleadoNombre','HoraInicio','HoraFin','Duracion','Estado'];
  var hRange = ws.getRange(1,1,1,hdrs.length);
  hRange.setValues([hdrs]);
  hRange.setBackground('#1E3A5F')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setFontSize(10)
        .setHorizontalAlignment('center');
  ws.setFrozenRows(1);

  ws.setColumnWidth(1, 160); // BreakID
  ws.setColumnWidth(2, 120); // EmpleadoID
  ws.setColumnWidth(3, 100); // Fecha
  ws.setColumnWidth(4, 180); // EmpleadoNombre
  ws.setColumnWidth(5, 90);  // HoraInicio
  ws.setColumnWidth(6, 90);  // HoraFin
  ws.setColumnWidth(7, 90);  // Duracion (min)
  ws.setColumnWidth(8, 100); // Estado

  Logger.log('✅ Hoja Breaks creada correctamente.');
  try { SpreadsheetApp.getUi().alert('✅ Hoja Breaks creada correctamente.'); } catch(e) {}
}

// =====================================================================
//  SETUP: Crear TODAS las hojas faltantes de una vez
//  Ejecutar: crearTodasLasHojas()
// =====================================================================
function crearTodasLasHojas() {
  crearHojaAseos();
  crearHojaBreaks();
  actualizarColumnasFotoMarcaciones();
  try { SpreadsheetApp.getUi().alert('✅ Listo — hojas Aseos y Breaks creadas, y columnas de foto en Marcaciones actualizadas.'); } catch(e) {}
}

// =====================================================================
//  SETUP: Agregar columnas de foto por tipo a la hoja Marcaciones
//  Ejecutar: actualizarColumnasFotoMarcaciones()
//  Las 4 nuevas cols se agregan a partir de la col 19:
//  Col 19 = FotoEntrada, 20 = FotoSalidaAlm, 21 = FotoRegresoAlm, 22 = FotoSalida
// =====================================================================
function actualizarColumnasFotoMarcaciones() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName('Marcaciones');
    if (!ws) { Logger.log('No existe hoja Marcaciones'); return; }

    // Leer encabezados actuales
    var hdrsActuales = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues()[0];
    var nuevos = ['FotoEntrada','FotoSalidaAlm','FotoRegresoAlm','FotoSalida'];
    var col = hdrsActuales.length + 1;

    nuevos.forEach(function(h) {
      var yaExiste = hdrsActuales.some(function(x){ return String(x).trim() === h; });
      if (!yaExiste) {
        ws.getRange(1, col).setValue(h)
          .setBackground('#1E3A5F').setFontColor('#fff').setFontWeight('bold')
          .setFontSize(10).setHorizontalAlignment('center');
        ws.setColumnWidth(col, 220);
        col++;
      }
    });
    Logger.log('✅ Columnas de foto agregadas a Marcaciones');
    try { SpreadsheetApp.getUi().alert('✅ Columnas FotoEntrada, FotoSalidaAlm, FotoRegresoAlm, FotoSalida agregadas a hoja Marcaciones.'); } catch(e2) {}
  } catch(e) { Logger.log('Error actualizarColumnasFotoMarcaciones: '+e.message); }
}

// =====================================================================
//  FUNCIÓN AUXILIAR: Probar saveFoto manualmente desde Apps Script
//  Ejecutar: testSaveFoto()  — revisa los logs para ver si hay error
// =====================================================================
function testSaveFoto() {
  var b64Mini = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';
  var url = saveFoto(b64Mini, 'test_foto_' + new Date().getTime());
  Logger.log('testSaveFoto resultado: ' + url);
  if (url) {
    SpreadsheetApp.getUi().alert('✅ saveFoto funciona!\n\nURL: ' + url);
  } else {
    SpreadsheetApp.getUi().alert('❌ saveFoto falló. Revisa los Logs (Ver → Registros)');
  }
}
